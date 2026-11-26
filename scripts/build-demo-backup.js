// 시연 백업 결과 만들기: 예시 문장 3개 × 역본 힌트(모름 + DB 역본 전부)를 실제로 분석해 저장한다.
// 시연 중 인터넷이나 AI가 실패하면 화면이 이 파일(data/demo-results.json)의 결과를 대신 보여준다.
//
// 사용법: npm run build:demo   (.env의 GEMINI_API_KEY 사용)
// 예시 문장(test-sentences.json 앞 3문장)이나 용어 DB를 바꾸면 다시 돌리고 커밋한다.
// 어떤 조합이 끝내 실패하면, 예전에 저장된 그 조합 결과를 그대로 둔다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { analyzeSentence, EDITIONS } from '../server/analyze.js'
import { DEFAULT_MODEL } from '../server/llm.js'
import { pickExamples } from '../src/lib/examples.js'

const tests = JSON.parse(readFileSync(new URL('../data/test-sentences.json', import.meta.url), 'utf8'))
const OUT_FILE = new URL('../data/demo-results.json', import.meta.url)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const keyOf = (문장, 역본) => `${역본 ?? '모름'}|${문장}`

// 실패하면 최대 3번 더 시도 (AI 서버가 바쁠 때 503 오류가 자주 남)
async function analyzeWithRetry(문장, 역본, tries = 3) {
  for (let k = 1; ; k++) {
    try {
      return await analyzeSentence(문장, 역본)
    } catch (err) {
      if (k > tries) throw err
      console.log(`   (실패, ${k * 5}초 뒤 다시 시도 ${k}/${tries}: ${err.message.slice(0, 80)})`)
      await sleep(k * 5000)
    }
  }
}

const old = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, 'utf8')) : { 결과: [] }
const oldByKey = new Map(old.결과.map((r) => [keyOf(r.문장, r.역본), r]))

const examples = pickExamples(tests)
const editions = [null, ...EDITIONS] // null = 역본 모름(힌트 없음)
const results = []
let failed = 0

for (const { 문장 } of examples) {
  for (const 역본 of editions) {
    const label = `${역본 ?? '모름'} | ${문장.slice(0, 30)}…`
    try {
      const r = await analyzeWithRetry(문장, 역본)
      const judged = r.개념어목록.filter((i) => !i.판정보류).length
      console.log(`✔ ${label}  (개념어 ${r.개념어목록.length}개, 판정 ${judged})`)
      results.push(r)
    } catch (err) {
      failed++
      const prev = oldByKey.get(keyOf(문장, 역본))
      console.log(`✘ ${label}  실패: ${err.message.slice(0, 80)}${prev ? ' → 예전 결과 유지' : ' → 저장 안 됨'}`)
      if (prev) results.push(prev)
    }
  }
}

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) // YYYY-MM-DD
writeFileSync(
  OUT_FILE,
  JSON.stringify({ 만든날짜: today, 모델: process.env.GEMINI_MODEL || DEFAULT_MODEL, 결과: results }, null, 2) + '\n',
)
const total = examples.length * editions.length
console.log(`\n저장: data/demo-results.json (${results.length}/${total}개${failed ? `, 실패 ${failed}개` : ''})`)
if (results.length < total) process.exitCode = 1
