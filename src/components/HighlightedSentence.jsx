import { COLORED_ORIGINS, PENDING, judgmentStyle, termStyle } from '../lib/termStyles.js'
import JudgmentBadge from './JudgmentBadge.jsx'
import TermMarker from './TermMarker.jsx'

// 입력한 문장 카드: 개념어를 원어별 색·밑줄로 하이라이트하고 바로 뒤에 판정 배지를 붙인다 (시안 3·7쪽)
// items: API의 개념어목록 (위치.시작 순서) / selected: 펼쳐 둔 개념어 번호 / onSelect(번호)
export default function HighlightedSentence({ 문장, items, selected, onSelect }) {
  // 문장을 [일반 글자 | 개념어 | 일반 글자 | …] 조각으로 나눈다
  const pieces = []
  let cursor = 0
  items.forEach((item, index) => {
    const { 시작, 끝 } = item.위치
    if (시작 < cursor || 끝 > 문장.length) return // 겹치거나 범위를 벗어난 위치는 건너뜀 (안전장치)
    if (시작 > cursor) pieces.push({ text: 문장.slice(cursor, 시작) })
    pieces.push({ text: 문장.slice(시작, 끝), item, index })
    cursor = 끝
  })
  if (cursor < 문장.length) pieces.push({ text: 문장.slice(cursor) })

  return (
    <section aria-label="입력한 문장" className="rounded-2xl border border-line bg-surface p-5 md:p-10">
      <p className="text-label text-ink-3">입력한 문장</p>
      <p className="mt-3 font-read text-reading break-keep">
        {pieces.map((piece, i) =>
          piece.item ? (
            <TermButton
              key={i}
              text={piece.text}
              item={piece.item}
              active={selected === piece.index}
              onClick={() => onSelect(piece.index)}
            />
          ) : (
            <span key={i}>{piece.text}</span>
          ),
        )}
      </p>
      <Legend items={items} />
    </section>
  )
}

// 하이라이트 + 배지를 합친 버튼 하나
function TermButton({ text, item, active, onClick }) {
  const s = judgmentStyle(item)
  const label = item.판정보류
    ? `${item.단어}: 판정 보류, 후보 ${item.후보원어.join(', ')}. 눌러서 대조 카드 보기`
    : `${item.단어}: ${item.판정원어}로 판정. 눌러서 대조 카드 보기`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-controls="judgment-detail"
      aria-label={label}
      className="group mx-0.5 inline rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        className={`rounded px-1 underline-offset-[0.3em] transition-shadow ${s.highlight} ${active ? `ring-2 ${s.ring}` : 'group-hover:ring-1 group-hover:ring-ink-3'}`}
      >
        {text}
      </span>{' '}
      <JudgmentBadge item={item} filled={active} />
    </button>
  )
}

// 범례: 이 문장에 실제로 나온 것만 (색 구별 원어 3개 중 판정된 것 + 판정 보류). 하나도 없으면 범례 없음
function Legend({ items }) {
  const shown = COLORED_ORIGINS.filter((원어) => items.some((it) => !it.판정보류 && it.판정원어 === 원어))
  const hasPending = items.some((it) => it.판정보류)
  if (shown.length === 0 && !hasPending) return null

  return (
    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-label font-normal text-ink-2">
      {shown.map((원어) => (
        <li key={원어} className="flex items-center gap-1.5">
          <TermMarker 원어={원어} size={10} />
          <span lang="de" className={`font-de text-body ${termStyle(원어).text}`}>{원어}</span>
          <span>· {termStyle(원어).underline}</span>
        </li>
      ))}
      {hasPending && (
        <li className="flex items-center gap-1.5">
          <TermMarker pending size={12} />
          <span>판정 보류 · {PENDING.underline}</span>
        </li>
      )}
    </ul>
  )
}
