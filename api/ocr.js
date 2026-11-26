// Vercel 서버리스 함수 — 주소: /api/ocr   (선택 기능: 책 사진 → 글자)
// 화면이 줄인 사진(base64)을 보내면, 사진 속 한국어 글자를 돌려준다.
//
// 요청: POST /api/ocr   본문 { "이미지": "base64 글자", "형식": "image/jpeg" }
// 응답: 성공 200 { 텍스트 } / 실패 { "오류": "한국어 메시지" } (너무 잦으면 429)
// 호출 제한은 문장 분석과 같은 기준을 함께 쓴다 (같은 사람 1분에 합쳐서 10번).
import { extractText } from '../server/ocr.js'
import { InputError } from '../server/analyze.js'
import { LlmConfigError } from '../server/llm.js'
import { allowRequest, clientIp } from '../server/rateLimit.js'

const json = (data, status = 200) => Response.json(data, { status })

export async function POST(request) {
  if (!allowRequest(clientIp(request))) {
    return json({ 오류: '요청이 너무 잦습니다. 1분 뒤 다시 시도해 주세요.' }, 429)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ 오류: '요청 형식이 잘못되었습니다. 사진을 다시 골라 주세요.' }, 400)
  }

  try {
    return json(await extractText(body?.이미지, body?.형식))
  } catch (err) {
    if (err instanceof InputError) return json({ 오류: err.message }, 400)
    // 원인만 기록한다. 사진·글자 내용은 남기지 않는다.
    console.error('[ocr]', err?.constructor?.name, String(err?.message ?? '').slice(0, 200))
    if (err instanceof LlmConfigError) {
      return json({ 오류: '서버에 GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 알려 주세요.' }, 500)
    }
    return json({ 오류: '사진을 읽는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' }, 502)
  }
}

export function GET() {
  return json({ 오류: '이 주소는 POST로 사진을 보내야 합니다.' }, 405)
}
