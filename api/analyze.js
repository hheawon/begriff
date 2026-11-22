// Vercel 서버리스 함수 — 주소: /api/analyze
// 화면(브라우저)은 여기로 문장을 보내고, 분석 결과 JSON을 받는다.
// API 키는 서버(이 함수)에서만 쓰이고 브라우저로는 절대 가지 않는다.
//
// 요청: POST /api/analyze   본문 { "문장": "..." }
// 응답: 성공 200 { 문장, 개념어목록: [...] } / 실패 { "오류": "한국어 메시지" }
import { analyzeSentence, InputError } from '../server/analyze.js'
import { LlmConfigError } from '../server/llm.js'

const json = (data, status = 200) => Response.json(data, { status })

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ 오류: '요청 형식이 잘못되었습니다. { "문장": "..." } 형태로 보내 주세요.' }, 400)
  }

  try {
    return json(await analyzeSentence(body?.문장))
  } catch (err) {
    if (err instanceof InputError) return json({ 오류: err.message }, 400)
    console.error('[analyze]', err) // 자세한 원인은 서버 기록(Vercel 로그)에만 남긴다
    if (err instanceof LlmConfigError) {
      return json({ 오류: '서버에 GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 알려 주세요.' }, 500)
    }
    return json({ 오류: 'AI 분석 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' }, 502)
  }
}

export function GET() {
  return json({ 오류: '이 주소는 POST로 { "문장": "..." }를 보내야 합니다.' }, 405)
}
