// AI 판정 정확도 평가 스크립트.
// data/test-sentences.json의 모든 문장을 분석하고, 정답원어와 비교해 점수를 낸다.
// 결과는 터미널에 보여주고, eval-results.md 맨 위에 날짜와 함께 기록한다.
//
// 사용법:
//   npm run eval                       역본 힌트 없이 평가 (가장 어려운 상황)
//   npm run eval -- --역본힌트           테스트 문장의 "출처" 역자로 역본 힌트를 주고 평가
//   npm run eval -- --url=https://begriff-green.vercel.app   배포된 /api/analyze로 평가
// (기본은 /api/analyze가 안에서 쓰는 analyzeSentence()를 직접 부른다. .env의 GEMINI_API_KEY 사용)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { analyzeSentence, EDITIONS } from '../server/analyze.js'
import { DEFAULT_MODEL } from '../server/llm.js'

const tests = JSON.parse(readFileSync(new URL('../data/test-sentences.json', import.meta.url), 'utf8'))
const RESULT_FILE = new URL('../eval-results.md', import.meta.url)

const args = process.argv.slice(2)
const useHint = args.includes('--역본힌트')
const urlArg = args.find((a) => a.startsWith('--url='))
const apiUrl = urlArg ? urlArg.slice('--url='.length).replace(/\/$/, '') + '/api/analyze' : null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 출처 "백종현 역, 아카넷 / B25" → DB 역본 "백종현,아카넷,2017" (역자 이름으로 찾음)
function editionFromSource(출처) {
  const 역자 = String(출처 ?? '').split(/[ ,/]/)[0].trim()
  if (!역자) return null
  return EDITIONS.find((e) => e.split(',')[0].trim() === 역자) ?? null
}

// 문장 하나 분석 (직접 호출 또는 HTTP)
async function analyze(문장, 역본) {
  if (!apiUrl) return analyzeSentence(문장, 역본)
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 문장, 역본 }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.오류 ?? `HTTP ${res.status}`)
  return data
}

// 실패하면 최대 3번 더 시도 (AI 서버가 바쁠 때 503 오류가 자주 남)
async function analyzeWithRetry(문장, 역본, tries = 3) {
  for (let k = 1; ; k++) {
    try {
      return await analyze(문장, 역본)
    } catch (err) {
      if (k > tries) throw err
      console.log(`   (실패, ${k * 5}초 뒤 다시 시도 ${k}/${tries}: ${err.message.slice(0, 80)})`)
      await sleep(k * 5000)
    }
  }
}

// 문항 하나 채점: 문장 속 그 개념어(여러 번 나오면 전부)의 판정을 정답원어와 비교
function grade(test, result) {
  const items = (result?.개념어목록 ?? []).filter((i) => i.단어 === test.개념어)
  if (items.length === 0) return { 판정: '오류', AI판정: '(개념어를 찾지 못함)', AI이유: '' }
  const wrong = items.filter((i) => !i.판정보류 && i.판정원어 !== test.정답원어)
  const held = items.filter((i) => i.판정보류)
  const AI판정 = items
    .map((i) => (i.판정보류 ? `보류 (후보: ${i.후보원어.join(', ')})` : i.판정원어))
    .join(' / ')
  const pick = wrong[0] ?? held[0] ?? items[0]
  const 판정 = wrong.length ? '오답' : held.length ? '보류' : '정답'
  return { 판정, AI판정, AI이유: pick.판정이유 ?? '' }
}

// ── 실행 ─────────────────────────────
const model = apiUrl ? `(배포 서버: ${apiUrl})` : process.env.GEMINI_MODEL || DEFAULT_MODEL
console.log(`정확도 평가 시작 — 문항 ${tests.length}개, 모델 ${model}, 역본 힌트 ${useHint ? '사용' : '없음'}\n`)

const cache = new Map() // 같은 (문장, 역본)은 한 번만 분석
const rows = []
for (const [n, test] of tests.entries()) {
  const 역본 = useHint ? editionFromSource(test.출처) : null
  const key = `${역본 ?? ''}\u0000${test.문장}`
  let row
  try {
    if (!cache.has(key)) {
      // 배포 주소로 평가할 때는 호출 제한(1분 10번, server/rateLimit.js)에 걸리지 않게 6.5초 간격
      if (cache.size > 0) await sleep(apiUrl ? 6500 : 1000)
      cache.set(key, await analyzeWithRetry(test.문장, 역본))
    }
    row = { ...test, 역본, ...grade(test, cache.get(key)) }
  } catch (err) {
    cache.set(key, null)
    row = { ...test, 역본, 판정: '오류', AI판정: '(분석 실패)', AI이유: err.message }
  }
  rows.push(row)
  const mark = { 정답: '✔', 오답: '✘', 보류: '…', 오류: '!' }[row.판정]
  console.log(`${mark} ${n + 1}. [${row.개념어}] 정답 ${row.정답원어} → AI ${row.AI판정}`)
}

const count = (p) => rows.filter((r) => r.판정 === p).length
const total = rows.length
const correct = count('정답')
const rate = total ? ((correct / total) * 100).toFixed(1) : '0.0'

console.log(`\n정답 ${correct}/${total} (${rate}%) · 판정 보류 ${count('보류')} · 오답 ${count('오답')} · 오류 ${count('오류')}`)

// ── eval-results.md에 기록 ─────────────────────────────
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const short = (s, n = 60) => ([...s].length > n ? [...s].slice(0, n).join('') + '…' : s)
const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)

const notOk = rows.filter((r) => r.판정 !== '정답')
const section = `## ${stamp} — 정답률 ${rate}% (${correct}/${total})

- 모델: ${model}
- 역본 힌트: ${useHint ? '사용 (출처의 역자로 역본 지정)' : '없음 ("모름" 상태)'}
- 테스트 문항: ${total}개 (서로 다른 문장 분석 ${cache.size}회)

| 정답 | 판정 보류 | 오답 | 오류 | 정답률 |
|---|---|---|---|---|
| ${correct}/${total} | ${count('보류')} | ${count('오답')} | ${count('오류')} | ${rate}% |

${
  notOk.length
    ? `### 맞히지 못한 문항

| 결과 | 문장 | 개념어 | 정답 | AI 판정 | AI 이유 |
|---|---|---|---|---|---|
${notOk
  .map((r) => `| ${r.판정} | ${cell(short(r.문장))} | ${cell(r.개념어)} | ${cell(r.정답원어)} | ${cell(r.AI판정)} | ${cell(r.AI이유)} |`)
  .join('\n')}`
    : '모든 문항을 맞혔습니다.'
}
`

const HEADER = '# AI 판정 정확도 평가 기록\n\n`npm run eval`로 만든 기록입니다. 최신 기록이 맨 위에 있습니다.\n\n'
const old = existsSync(RESULT_FILE) ? readFileSync(RESULT_FILE, 'utf8').replace(HEADER, '') : ''
writeFileSync(RESULT_FILE, HEADER + section + (old ? '\n---\n\n' + old : ''))
console.log('\n결과를 eval-results.md에 저장했습니다.')
