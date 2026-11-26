// 예시 문장 고르기 — 화면(예시 버튼)과 시연 백업 스크립트(scripts/build-demo-backup.js)가 함께 쓴다.
// test-sentences.json에서 중복 없이 앞의 문장 3개.
// (한 문장을 개념어별로 여러 줄 적을 수 있어서 중복을 뺀다. 정답이 "판정 보류"인 문장은 보류 예시로 표시)
const EXAMPLE_COUNT = 3

export function pickExamples(testSentences) {
  return [...new Map(testSentences.map((t) => [t.문장, t])).values()]
    .slice(0, EXAMPLE_COUNT)
    .map((t) => ({ 문장: t.문장, 보류: testSentences.some((s) => s.문장 === t.문장 && s.정답원어 === '판정 보류') }))
}
