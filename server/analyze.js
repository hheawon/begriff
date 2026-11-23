// 문장 분석의 핵심 로직.
// 1) 용어 DB(data/terms.json)를 근거 자료로 프롬프트를 만들고
// 2) AI(server/llm.js)에게 개념어 찾기·원어 판정·해설을 시킨 뒤
// 3) AI 답을 그대로 믿지 않고 DB와 대조해 검사·보충한다. (위치 계산, 근거 붙이기, 판정 보류 처리)
import terms from '../data/terms.json' with { type: 'json' }
import { generateJson } from './llm.js'

export const MAX_LENGTH = 500
const HOLD = '판정 보류'

// 사용자가 입력을 잘못했을 때 (빈 문장, 너무 긴 문장)
export class InputError extends Error {}

// ── DB에서 미리 만들어 두는 표 ─────────────────────────────
const ORIGINS = terms.map((t) => t.원어)

// 번역어 → 그 번역어로 옮겨지는 원어 목록. 예: '선험적' → ['a priori', 'transzendental']
const candidatesOf = new Map()
for (const term of terms) {
  for (const { 번역어 } of term.번역어목록) {
    const list = candidatesOf.get(번역어) ?? []
    if (!list.includes(term.원어)) list.push(term.원어)
    candidatesOf.set(번역어, list)
  }
}
const TRANSLATIONS = [...candidatesOf.keys()]

// 역본 목록 (DB에 적힌 그대로). 사용자가 "이 문장은 이 역본에서 왔다"고 고를 수 있다.
export const EDITIONS = [...new Set(terms.flatMap((t) => t.번역어목록.map((r) => r.역본)))].filter(Boolean)

// 고른 역본에서 번역어 → 원어 목록. 예: 백종현 역에서 '선험적' → ['a priori']
function mappingOf(역본) {
  const map = new Map()
  for (const term of terms) {
    for (const row of term.번역어목록) {
      if (row.역본 !== 역본) continue
      const list = map.get(row.번역어) ?? []
      if (!list.includes(term.원어)) list.push(term.원어)
      map.set(row.번역어, list)
    }
  }
  return map
}

// 역본 기준 원어: 그 역본에서 이 번역어가 원어 하나로만 옮겨질 때만 그 원어, 아니면 null
function editionOriginOf(mapping, 단어) {
  const list = mapping?.get(단어)
  return list?.length === 1 ? list[0] : null
}

// 근거: (원어, 번역어)에 해당하는 DB 줄의 역본 + 원어의 원문위치. AI가 아니라 DB에서 그대로 가져온다.
function evidenceFor(원어, 번역어) {
  const term = terms.find((t) => t.원어 === 원어)
  if (!term) return []
  return term.번역어목록
    .filter((t) => t.번역어 === 번역어)
    .map((t) => ({ 원어, 역본: t.역본, 원문위치: term.원문위치.join(', ') }))
}

// ── AI에게 주는 지시문과 답 형식 ─────────────────────────────
const SYSTEM = `너는 칸트 『순수이성비판』 한국어 번역 문장의 개념어가 어떤 원어를 가리키는지 밝히는 학습 도우미다.
번역기가 아니다. 반드시 아래 규칙을 지켜라.

[규칙]
1. 근거는 사용자가 준 "용어 DB"뿐이다. DB에 없는 내용, 역본, 쪽수, 인용, 학자 이름은 절대 지어내지 마라.
2. 개념어 찾기: DB의 "번역어" 목록에 있는 단어만 찾는다. 조사·어미는 빼고, 문장에 적힌 글자 그대로 "단어"에 적는다.
   (예: 문장의 "선험적이라고" → 단어 "선험적") DB 번역어가 아닌 단어는 넣지 마라. 문장에 여러 번 나오면 나온 횟수만큼 넣는다.
3. 원어 판정: 그 번역어의 후보 원어 중에서 문맥을 보고 고른다. DB의 "판단단서"를 가장 중요하게 본다.
4. 확신도: 판단단서와 문맥이 분명히 맞으면 "높음", 어느 정도 맞으면 "중간", 문맥만으로 가리기 어려우면 "낮음".
   확신도가 "낮음"이면 판정원어는 "${HOLD}"로 적는다. 억지로 고르지 마라.
5. 판정이유: 문장의 어떤 표현이 DB의 어떤 판단단서와 맞는지 한두 문장으로 쓴다.
6. 해설: 판정한 원어의 DB "해설" 내용만 바탕으로 학부생이 이해하기 쉽게 한두 문장으로 쓴다. DB에 없는 설명을 덧붙이지 마라.
7. 출처(역본·원문위치)는 쓰지 마라. 프로그램이 DB에서 직접 붙인다.
8. 개념어가 하나도 없으면 빈 목록을 돌려준다.
9. 같은 입력에는 언제나 같은 답을 하도록, 규칙에 따라 일관되게 판단하라.
10. [역본 힌트]가 주어지면: 그 역본에서 각 번역어가 어떤 원어로 옮겨지는지를 판단단서와 함께 강한 단서로 쓴다.
    그래도 판정은 문맥을 보고 직접 내린다. 문맥과 판단단서가 역본 대응과 분명히 어긋나면 문맥을 따르고,
    판정이유에 "역본 대응과 다르게 판정한 이유"를 적는다. 사용자가 역본을 잘못 골랐을 수 있기 때문이다.
    이때 역본 대응 자체를 바꿔 말하지 마라. 예: 그 역본에서 '선험적' → a priori인데 문맥상 transzendental로 판정했다면,
    "이 역본에서 '선험적'은 transzendental이다"라고 쓰지 말고 "이 역본에서는 보통 a priori지만 문맥상 transzendental로 보인다"처럼 쓴다.`

const SCHEMA = {
  type: 'object',
  properties: {
    개념어목록: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          단어: { type: 'string', description: '문장에 적힌 그대로의 DB 번역어 (조사 제외)' },
          판정원어: { type: 'string', enum: [...ORIGINS, HOLD] },
          확신도: { type: 'string', enum: ['높음', '중간', '낮음'] },
          판정이유: { type: 'string' },
          해설: { type: 'string' },
        },
        required: ['단어', '판정원어', '확신도', '판정이유', '해설'],
      },
    },
  },
  required: ['개념어목록'],
}

function buildPrompt(sentence, 역본, mapping) {
  const hint = 역본
    ? `[역본 힌트]
사용자가 이 문장이 "${역본}" 역본에서 왔다고 알려 주었다. 이 역본의 번역어 → 원어 대응(용어 DB 기준):
${[...mapping].map(([번역어, 원어목록]) => `- ${번역어} → ${원어목록.join(', ')}`).join('\n')}

`
    : ''
  return `[용어 DB]
${JSON.stringify(terms, null, 1)}

${hint}[분석할 문장]
${sentence}`
}

// ── AI 답 검사·보충 ─────────────────────────────
// 문장에서 단어가 나오는 모든 시작 위치
function occurrences(sentence, word) {
  const found = []
  let i = sentence.indexOf(word)
  while (i !== -1) {
    found.push(i)
    i = sentence.indexOf(word, i + word.length)
  }
  return found
}

// (테스트·정확도 평가에서도 쓰도록 export)
// 역본: 사용자가 고른 역본 (없으면 null). 역본 기준 원어와 불일치 여부는 AI가 아니라 여기서 DB로 계산한다.
export function finalize(sentence, aiItems, 역본 = null) {
  const taken = new Set() // 이미 배정된 시작 위치 (같은 단어가 두 번 나올 때 차례로 배정)
  const result = []
  const mapping = 역본 ? mappingOf(역본) : null
  // 역본 기준 원어와 AI 판정이 다르면 true (판정 보류면 비교하지 않음)
  const editionFields = (단어, 판정원어) => {
    const 역본기준원어 = editionOriginOf(mapping, 단어)
    return { 역본기준원어, 역본불일치: Boolean(역본기준원어 && 판정원어 && 판정원어 !== 역본기준원어) }
  }

  for (const item of aiItems ?? []) {
    const 단어 = String(item?.단어 ?? '').trim()
    const 후보원어 = candidatesOf.get(단어)
    if (!후보원어) continue // DB에 없는 단어 → 버림
    const 시작 = occurrences(sentence, 단어).find((i) => !taken.has(i))
    if (시작 === undefined) continue // 문장에 없는 단어(또는 남는 중복) → 버림
    taken.add(시작)

    let 판정원어 = item.판정원어
    let 확신도 = ['높음', '중간', '낮음'].includes(item.확신도) ? item.확신도 : '낮음'
    let 판정이유 = String(item.판정이유 ?? '')
    // 후보가 아닌 원어를 골랐거나 확신도가 낮으면 → 판정 보류
    if (!후보원어.includes(판정원어)) {
      if (판정원어 !== HOLD) 판정이유 = `AI가 이 번역어의 후보가 아닌 원어를 골라 판정을 보류합니다. ${판정이유}`.trim()
      판정원어 = null
      확신도 = '낮음'
    }
    if (확신도 === '낮음') 판정원어 = null
    const 판정보류 = 판정원어 === null

    result.push({
      단어,
      위치: { 시작, 끝: 시작 + 단어.length },
      판정원어,
      확신도,
      판정보류,
      후보원어,
      판정이유,
      해설: String(item.해설 ?? ''),
      근거: (판정보류 ? 후보원어 : [판정원어]).flatMap((o) => evidenceFor(o, 단어)),
      ...editionFields(단어, 판정원어),
    })
  }

  // AI가 놓친 DB 번역어가 문장에 있으면 판정 보류로 보충한다. (긴 단어부터 확인해 겹침 방지)
  const covered = (s, e) => result.some((r) => s < r.위치.끝 && r.위치.시작 < e)
  for (const 단어 of [...TRANSLATIONS].sort((a, b) => b.length - a.length)) {
    for (const 시작 of occurrences(sentence, 단어)) {
      if (covered(시작, 시작 + 단어.length)) continue
      const 후보원어 = candidatesOf.get(단어)
      result.push({
        단어,
        위치: { 시작, 끝: 시작 + 단어.length },
        판정원어: null,
        확신도: '낮음',
        판정보류: true,
        후보원어,
        판정이유: 'AI가 이 단어를 판정하지 않아 보류합니다. 후보 원어를 확인하세요.',
        해설: '',
        근거: 후보원어.flatMap((o) => evidenceFor(o, 단어)),
        ...editionFields(단어, null),
      })
    }
  }

  return result.sort((a, b) => a.위치.시작 - b.위치.시작)
}

// ── 바깥에서 쓰는 함수 ─────────────────────────────
// 입력 검사. 문제가 있으면 InputError(사용자에게 그대로 보여줄 한국어 메시지)를 던진다.
export function validateSentence(input) {
  const sentence = typeof input === 'string' ? input.trim() : ''
  if (!sentence) throw new InputError('분석할 문장을 입력해 주세요.')
  const length = [...sentence].length
  if (length > MAX_LENGTH) {
    throw new InputError(`문장은 ${MAX_LENGTH}자 이하로 입력해 주세요. (지금 ${length}자)`)
  }
  return sentence
}

// 역본 검사: 비어 있거나 "모름"이면 null(힌트 없음), DB에 없는 역본이면 InputError
export function validateEdition(input) {
  const 역본 = typeof input === 'string' ? input.trim() : ''
  if (!역본 || 역본 === '모름') return null
  if (!EDITIONS.includes(역본)) throw new InputError('알 수 없는 역본입니다. 목록에서 다시 골라 주세요.')
  return 역본
}

export async function analyzeSentence(input, editionInput = null) {
  const 문장 = validateSentence(input)
  const 역본 = validateEdition(editionInput)
  const prompt = buildPrompt(문장, 역본, 역본 ? mappingOf(역본) : null)
  const ai = await generateJson({ system: SYSTEM, prompt, schema: SCHEMA })
  return { 문장, 역본, 개념어목록: finalize(문장, ai?.개념어목록, 역본) }
}
