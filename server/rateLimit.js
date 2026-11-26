// 간단한 호출 제한: 같은 사람(IP)이 1분에 10번까지만 AI 분석을 부를 수 있다.
// AI 사용량(요금·무료 한도)을 지키고, 버튼 연타나 자동 호출을 막기 위한 것.
//
// ※ "간단한" 제한이다. 기록을 서버 메모리에만 두므로, Vercel이 서버를 여러 대 띄우거나
//    서버가 다시 시작되면 횟수가 따로 세어지거나 초기화된다. 공모전 시연 규모에서는 충분하다.
export const LIMIT = 10
export const WINDOW_MS = 60_000

const hits = new Map() // IP → 최근 호출 시각 목록

// 요청 보낸 사람의 IP. Vercel은 x-forwarded-for 맨 앞에 실제 IP를 넣어 준다.
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'local'
}

// 이번 호출을 허락하면 true (그리고 기록), 너무 잦으면 false
export function allowRequest(ip, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMIT) {
    hits.set(ip, recent)
    return false
  }
  recent.push(now)
  hits.set(ip, recent)

  // 오래된 기록 정리 (메모리가 계속 늘지 않게)
  if (hits.size > 1000) {
    for (const [key, list] of hits) {
      if (list.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
    }
  }
  return true
}
