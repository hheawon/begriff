// Vercel 서버리스 함수 — 주소: /api/analyze
// 화면(브라우저)은 여기로 문장을 보내고, 분석 결과 JSON을 받는다.
// API 키는 서버(이 함수)에서만 쓰이고 브라우저로는 절대 가지 않는다.
//
// 요청: POST /api/analyze   본문 { "문장": "...", "역본": "..." }  (역본은 선택. 없거나 "모름"이면 힌트 없이 분석)
// 응답: 성공 200 { 문장, 역본, 개념어목록: [...] } / 실패 { "오류": "한국어 메시지" } (너무 잦으면 429)
import { analyzeSentence, InputError } from '../server/analyze.js'
import { LlmConfigError } from '../server/llm.js'
import { allowRequest, clientIp } from '../server/rateLimit.js'

const json = (data, status = 200) => Response.json(data, { status })

export async function POST(request) {
  // 같은 사람이 1분에 10번 넘게 부르면 AI를 부르지 않고 거절 (server/rateLimit.js)
  if (!allowRequest(clientIp(request))) {
    return json({ 오류: '요청이 너무 잦습니다. 1분 뒤 다시 시도해 주세요.' }, 429)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ 오류: '요청 형식이 잘못되었습니다. { "문장": "..." } 형태로 보내 주세요.' }, 400)
  }

  try {
    return json(await analyzeSentence(body?.문장, body?.역본))
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
