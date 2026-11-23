// 화면에서 /api/analyze(서버)로 문장을 보내고 결과를 받는 곳.
// 어떤 문제가 생겨도 사용자에게 보여줄 한국어 메시지가 담긴 AnalyzeError 하나로 바꿔 던진다.

const TIMEOUT_MS = 30_000 // 30초 넘게 답이 없으면 포기

const MSG_OFFLINE = '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
const MSG_TIMEOUT = 'AI 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.'
const MSG_FALLBACK = '분석 결과를 받지 못했습니다. 잠시 후 다시 시도해 주세요.'

export class AnalyzeError extends Error {}

// 역본: 사용자가 고른 역본 힌트 (없으면 null → 힌트 없이 분석)
export async function requestAnalysis(문장, 역본 = null) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 문장, 역본 }),
      signal: controller.signal,
    })

    let data = null
    try {
      data = await response.json()
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      data = null // JSON이 아닌 답 (서버가 꺼져 있거나 주소가 틀림)
    }

    // 서버가 준 한국어 오류 문구가 있으면 그대로 보여준다
    if (!response.ok) throw new AnalyzeError(data?.오류 || MSG_FALLBACK)
    if (typeof data?.문장 !== 'string' || !Array.isArray(data?.개념어목록)) {
      throw new AnalyzeError(MSG_FALLBACK)
    }
    return data
  } catch (err) {
    if (err instanceof AnalyzeError) throw err
    if (err?.name === 'AbortError') throw new AnalyzeError(MSG_TIMEOUT)
    throw new AnalyzeError(MSG_OFFLINE) // fetch 자체가 실패 = 대개 인터넷 문제
  } finally {
    clearTimeout(timer)
  }
}
