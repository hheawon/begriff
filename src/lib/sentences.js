// 사진에서 읽은 글을 문장 단위로 나눈다. (사진 입력 → "문장 고르기" 카드에서 사용)
// AI가 아니라 정해진 규칙으로 나누므로 같은 글은 언제나 같게 나뉜다.
//
// 규칙
// 1. 줄바꿈(문단)에서 먼저 나눈다.
// 2. 문장 끝 표시(. ? ! 。)와 그 뒤에 붙은 닫는 따옴표·괄호 다음에 띄어쓰기가 오면 나눈다.
//    "1.5"처럼 점 뒤에 띄어쓰기가 없으면 나누지 않는다.
// 3. 단, 아래 경우는 문장 끝이 아니므로 다음 조각과 다시 붙인다.
//    - 번호·기호만 있는 조각: "3." "IV." "가." "A." "§3." "(2)" "1)" → "3. 사람들이 …"가 한 문장
//    - 괄호가 아직 안 닫힌 조각: "…이다(B25. 참조)"의 "(B25."
const SENTENCE_END = /([.?!。]+["'”’」』)\]]*)\s+/g
const CUT = '\u0000' // 나눌 자리 표시 (글에 나올 일이 없는 글자)
const LIST_MARKER = /^[([]?(\d{1,3}|[IVXLCivxlc]{1,6}|[가-하]|[A-Za-z]|§\s*\d+)[.)\]]$/

const unclosed = (s) => (s.match(/[([]/g)?.length ?? 0) > (s.match(/[)\]]/g)?.length ?? 0)

function splitParagraph(paragraph) {
  const pieces = paragraph.replace(SENTENCE_END, `$1${CUT}`).split(CUT).map((s) => s.trim()).filter(Boolean)
  const merged = []
  let carry = ''
  for (const piece of pieces) {
    const joined = carry ? `${carry} ${piece}` : piece
    if (LIST_MARKER.test(joined) || unclosed(joined)) carry = joined // 아직 문장이 안 끝남 → 다음 조각과 붙임
    else {
      merged.push(joined)
      carry = ''
    }
  }
  if (carry) merged.push(carry)
  return merged
}

export function splitSentences(text) {
  return String(text ?? '')
    .split(/\n+/)
    .flatMap(splitParagraph)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
