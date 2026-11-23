// 터미널에서 문장 분석을 바로 시험해 보는 스크립트.
// 사용법: npm run try:analyze -- "모든 인식을 선험적이라고 부른다"
//   역본 힌트와 함께: npm run try:analyze -- --역본="백종현,아카넷,2017" "모든 인식을 선험적이라고 부른다"
// (.env 파일의 GEMINI_API_KEY를 사용한다)
import { analyzeSentence } from '../server/analyze.js'

const args = process.argv.slice(2)
const editionArg = args.find((a) => a.startsWith('--역본='))
const edition = editionArg ? editionArg.slice('--역본='.length) : null
const sentence = args.filter((a) => a !== editionArg).join(' ')
if (!sentence) {
  console.log('사용법: npm run try:analyze -- "분석할 문장"')
  process.exit(1)
}

try {
  const started = Date.now()
  const result = await analyzeSentence(sentence, edition)
  console.log(JSON.stringify(result, null, 2))
  console.log(`\n(걸린 시간: ${((Date.now() - started) / 1000).toFixed(1)}초)`)
} catch (err) {
  console.error('오류:', err.message)
  process.exit(1)
}
