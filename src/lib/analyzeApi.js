// 화면에서 /api/analyze(서버)로 문장을 보내고 결과를 받는 곳.
// 어떤 문제가 생겨도 사용자에게 보여줄 한국어 메시지가 담긴 AnalyzeError 하나로 바꿔 던진다.
//
// 시연 백업: 실패했는데 그 문장·역본이 미리 저장된 예시(data/demo-results.json, npm run build:demo)라면
// 오류 대신 저장된 결과를 { ...결과, 저장된결과: true }로 돌려준다. (입력 오류는 제외)
import demo from '../../data/demo-results.json'

const TIMEOUT_MS = 30_000 // 30초 넘게 답이 없으면 포기
const TIMEOUT_SAVED_MS = 15_000 // 저장된 결과가 있는 예시는 15초만 기다리고 저장된 결과로 (시연이 멈추지 않게)

const MSG_OFFLINE = '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
const MSG_TIMEOUT = 'AI 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.'
const MSG_FALLBACK = '분석 결과를 받지 못했습니다. 잠시 후 다시 시도해 주세요.'

export class AnalyzeError extends Error {}

// 입력이 잘못된 경우(400: 빈 문장, 500자 초과 등) — 저장된 결과로 대신하지 않는다
class InputRejected extends AnalyzeError {}

function savedResult(문장, 역본) {
  const found = demo.결과.find((r) => r.문장 === 문장 && (r.역본 ?? null) === (역본 ?? null))
  return found ? { ...found, 저장된결과: true } : null
}

// 역본: 사용자가 고른 역본 힌트 (없으면 null → 힌트 없이 분석)
export async function requestAnalysis(문장, 역본 = null) {
  const saved = savedResult(문장, 역본)
  try {
    const data = await postJson('/api/analyze', { 문장, 역본 }, saved ? TIMEOUT_SAVED_MS : TIMEOUT_MS)
    if (typeof data?.문장 !== 'string' || !Array.isArray(data?.개념어목록)) throw new AnalyzeError(MSG_FALLBACK)
    return data
  } catch (err) {
    if (saved && !(err instanceof InputRejected)) return saved
    throw err
  }
}

// ── 사진 문장 인식 (선택 기능) ─────────────────────────────
const PHOTO_MAX_SIDE = 1600 // 긴 변을 이 크기로 줄여 보낸다 (휴대폰 원본 사진은 너무 큼)
const MSG_PHOTO_OPEN = '이 사진을 열 수 없습니다. JPG나 PNG 사진으로 다시 골라 주세요.'
const MSG_PHOTO_EMPTY = '사진에서 글자를 읽지 못했습니다. 글자가 크고 또렷하게 나오도록 다시 찍어 주세요.'

// 책 사진(File) → 읽은 글자(string). 문제가 있으면 한국어 메시지가 담긴 AnalyzeError
export async function requestOcr(file) {
  if (!file?.type?.startsWith('image/')) throw new AnalyzeError('사진 파일만 고를 수 있습니다.')
  const 이미지 = await shrinkToJpeg(file)
  const data = await postJson('/api/ocr', { 이미지, 형식: 'image/jpeg' }, TIMEOUT_MS)
  const 텍스트 = typeof data?.텍스트 === 'string' ? data.텍스트.trim() : ''
  if (!텍스트) throw new AnalyzeError(MSG_PHOTO_EMPTY)
  return 텍스트
}

// 사진을 긴 변 1600px JPEG로 줄여 base64 글자로 (휴대폰 사진의 회전 정보도 반영)
async function shrinkToJpeg(file) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new AnalyzeError(MSG_PHOTO_OPEN)
  }
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // 투명한 PNG도 흰 바탕으로
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}

// ── 서버에 JSON 보내기 (분석·사진 공통) ─────────────────────────────
// 성공하면 서버 답(JSON)을, 실패하면 한국어 메시지의 AnalyzeError(입력 오류는 InputRejected)를 던진다.
async function postJson(path, body, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    if (response.status === 400) throw new InputRejected(data?.오류 || MSG_FALLBACK)
    if (!response.ok) throw new AnalyzeError(data?.오류 || MSG_FALLBACK)
    if (!data) throw new AnalyzeError(MSG_FALLBACK)
    return data
  } catch (err) {
    if (err instanceof AnalyzeError) throw err
    if (err?.name === 'AbortError') throw new AnalyzeError(MSG_TIMEOUT)
    throw new AnalyzeError(MSG_OFFLINE) // fetch 자체가 실패 = 대개 인터넷 문제
  } finally {
    clearTimeout(timer)
  }
}
