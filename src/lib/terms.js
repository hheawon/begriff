// 용어 DB(data/terms.json)를 읽고 검색하는 함수 모음.
// 화면 코드와 분리해 두어서 개념어 사전(3단계)과 문장 분석(6단계)이 함께 쓴다.
import terms from '../../data/terms.json'

export const allTerms = terms

// 검색 비교용: 앞뒤 공백을 지우고 소문자로 ("A Priori" = "a priori")
export function normalize(text) {
  return (text ?? '').trim().toLowerCase()
}

// 번역어 → 그 번역어로 옮겨지는 원어 목록
// 예: '선험적' → { 번역어: '선험적', 원어목록: ['a priori', 'transzendental'] }
const originsByTranslation = new Map()
for (const term of terms) {
  for (const { 번역어 } of term.번역어목록) {
    const key = normalize(번역어)
    if (!originsByTranslation.has(key)) originsByTranslation.set(key, { 번역어, 원어목록: [] })
    const entry = originsByTranslation.get(key)
    if (!entry.원어목록.includes(term.원어)) entry.원어목록.push(term.원어)
  }
}

// 이 번역어가 원어 2개 이상에 쓰이는가 (표의 "겹침 주의" 표시)
export function isOverlapping(번역어) {
  return (originsByTranslation.get(normalize(번역어))?.원어목록.length ?? 0) >= 2
}

// 한국어 조사 고르기: 받침이 있으면 앞의 것, 없으면 뒤의 것
// 예: josa('선험적', '은', '는') → '은' / josa('아프리오리', '은', '는') → '는'
// '으로/로'는 ㄹ 받침 뒤에서도 '로'를 쓴다.
export function josa(word, withFinal, withoutFinal) {
  const w = word ?? ''
  const code = w.charCodeAt(w.length - 1) - 0xac00
  if (!(code >= 0 && code <= 11171)) return withFinal // 한글이 아니면 받침 있는 쪽으로
  const final = code % 28
  if (final === 0) return withoutFinal
  if (withFinal === '으로' && final === 8) return withoutFinal // ㄹ 받침
  return withFinal
}

// 원어 하나의 번역어를 중복 없이 (목록 카드에 "선험적 · 선천적 · 아프리오리"로 보여줄 때)
export function translationsOf(term) {
  return [...new Set(term.번역어목록.map((t) => t.번역어))]
}

// 검색: 원어나 번역어에 검색어가 들어 있으면 결과에 넣는다.
// 검색어가 번역어와 정확히 같고 그 번역어가 원어 2개 이상에 쓰이면 overlap을 돌려준다 → 경고 상자
export function searchTerms(query) {
  const q = normalize(query)
  if (!q) return { results: terms, others: [], overlap: null }

  const matches = (term) =>
    normalize(term.원어).includes(q) || term.번역어목록.some((t) => normalize(t.번역어).includes(q))

  const exact = originsByTranslation.get(q)
  const overlap = exact && exact.원어목록.length >= 2 ? exact : null

  return {
    results: terms.filter(matches),
    others: terms.filter((term) => !matches(term)),
    overlap,
  }
}
