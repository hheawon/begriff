// 사진에서 읽은 글을 문장 단위로 나눈다. (사진 입력 → "문장 고르기" 카드에서 사용)
// AI가 아니라 정해진 규칙으로 나누므로 같은 글은 언제나 같게 나뉜다.
//
// 규칙
// 1. 줄바꿈(문단)에서 먼저 나눈다.
// 2. 문장 끝 표시(. ? ! 。)와 그 뒤에 붙은 닫는 따옴표·괄호 다음에 띄어쓰기가 오면 나눈다.
//    "1.5"처럼 점 뒤에 띄어쓰기가 없으면 나누지 않는다.
const SENTENCE_END = /([.?!。]+["'”’」』)\]]*)\s+/g
const CUT = '\u0000' // 나눌 자리 표시 (글에 나올 일이 없는 글자)

export function splitSentences(text) {
  return String(text ?? '')
    .split(/\n+/)
    .flatMap((paragraph) => paragraph.replace(SENTENCE_END, `$1${CUT}`).split(CUT))
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
