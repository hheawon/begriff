import { useEffect, useRef, useState } from 'react'

const MAX_LENGTH = 500 // 분석 글자 수 제한 (AnalyzeForm·서버와 같음)

// "사진에서 읽은 문장" 고르기 카드 (사진 입력 → 문장별로 보여주고 눌러서 고르기)
// 문장을 누르면 형광펜처럼 칠해지고, 여러 개 고를 수 있다. 넣을 때는 원래 순서대로 이어 붙인다.
// onInsert(글): 입력창에 넣을 글, onCancel(): 닫기
export default function SentencePicker({ sentences, onInsert, onCancel }) {
  const [picked, setPicked] = useState(() => new Set())
  const ref = useRef(null)

  // 새 사진을 읽으면 선택을 비우고, 카드가 보이도록 스크롤 (휴대폰에서 특히)
  useEffect(() => {
    setPicked(new Set())
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [sentences])

  const chosen = sentences.filter((_, i) => picked.has(i))
  const length = [...chosen.join(' ')].length
  const tooLong = length > MAX_LENGTH

  function toggle(i) {
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <section
      ref={ref}
      aria-labelledby="sentence-picker-title"
      className="mt-3 scroll-mt-4 rounded-2xl border border-brand bg-surface p-4 md:p-6"
    >
      <h3 id="sentence-picker-title" className="text-label text-ink">사진에서 읽은 문장 {sentences.length}개</h3>
      <p className="mt-1 text-label font-normal text-ink-2">분석할 문장을 누르세요. 여러 개 고를 수 있어요.</p>

      <ol className="mt-4 space-y-2">
        {sentences.map((s, i) => {
          const on = picked.has(i)
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(i)}
                className={
                  'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
                  (on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink-3')
                }
              >
                <CheckMark on={on} />
                <span className="font-read text-body text-ink">{s}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 md:flex-row md:items-center md:justify-between">
        <span className={`text-label ${tooLong ? 'text-ap-text' : 'font-normal text-ink-3'}`} aria-live="polite">
          {chosen.length}개 선택 · {length} / {MAX_LENGTH}자{tooLong && ' · 너무 깁니다 (넣은 뒤 줄여 주세요)'}
        </span>
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-label text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onInsert(sentences.join(' '))}
            className="rounded-xl border border-brand px-4 py-2 text-label text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            전체 넣기
          </button>
          <button
            type="button"
            disabled={chosen.length === 0}
            onClick={() => onInsert(chosen.join(' '))}
            className="rounded-xl bg-brand px-5 py-2 text-label text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            선택한 문장 넣기{chosen.length > 0 && ` (${chosen.length}개)`}
          </button>
        </div>
      </div>
    </section>
  )
}

// 선택 표시: 고르면 채워진 체크, 아니면 빈 동그라미
function CheckMark({ on }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" className={`mt-1 shrink-0 ${on ? 'text-brand' : 'text-ink-3'}`}>
      {on ? (
        <>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  )
}
