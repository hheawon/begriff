import { EDITIONS, editionLabel } from '../lib/terms.js'
import { WarningIcon } from './JudgmentDetail.jsx'

export const UNKNOWN_EDITION = '모름'

export const MAX_LENGTH = 500 // 서버(server/analyze.js)와 같은 글자 수 제한

// 글자 수: 서버와 똑같이 앞뒤 공백을 빼고, 한글·이모지도 한 글자로 센다
export function countChars(text) {
  return [...text.trim()].length
}

// 문장 입력 카드 + 예시 문장 (디자인 가이드 시안 2·6쪽)
// edition: 고른 역본 힌트 ('모름'이면 힌트 없음)
export default function AnalyzeForm({ value, onChange, onSubmit, loading, error, examples, edition = UNKNOWN_EDITION, onEditionChange = () => {} }) {
  const length = countChars(value)
  const tooLong = length > MAX_LENGTH
  const canSubmit = length > 0 && !tooLong && !loading

  function submit(e) {
    e.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <div>
      <form onSubmit={submit} aria-busy={loading}>
        <div className="rounded-2xl border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft">
          <label htmlFor="sentence-input" className="block px-5 pt-4 text-label text-ink md:px-6">
            번역 문장
          </label>
          <textarea
            id="sentence-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl(⌘) + Enter로도 분석
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e)
            }}
            readOnly={loading}
            rows={5}
            placeholder="예: 수학적 판단은 모두 선험적 종합판단이다."
            aria-describedby="sentence-count"
            className="block min-h-40 w-full resize-y bg-transparent px-5 py-3 font-read text-h2 font-normal text-ink outline-none placeholder:text-ink-3 md:min-h-48 md:px-6"
          />
          <div className="flex items-center justify-end gap-4 border-t border-line px-5 py-3 md:px-4">
            <span
              id="sentence-count"
              className={`text-label ${tooLong ? 'text-ap-text' : 'font-normal text-ink-3'}`}
            >
              {length} / {MAX_LENGTH}자{tooLong && ' · 너무 깁니다'}
            </span>
            <SubmitButton disabled={!canSubmit} loading={loading} className="hidden md:inline-flex" />
          </div>
        </div>
        <EditionPicker value={edition} onChange={onEditionChange} disabled={loading} />
        {/* 휴대폰: 카드 아래 가로 전체 폭 버튼 (시안 6쪽) */}
        <SubmitButton disabled={!canSubmit} loading={loading} className="mt-4 flex w-full md:hidden" />
      </form>

      {/* 분석 중 안내 (화면 낭독기용) */}
      <p className="sr-only" aria-live="polite">
        {loading ? 'AI가 문장을 분석하고 있습니다.' : ''}
      </p>

      {error && (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl border border-ink-3 bg-surface p-4 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="flex items-start gap-2 text-body text-ink">
            <WarningIcon className="mt-1 text-ap-line" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="self-start rounded-xl border border-brand px-4 py-2 text-label whitespace-nowrap text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 md:self-auto"
          >
            다시 시도
          </button>
        </div>
      )}

      {examples.length > 0 && (
        <section className="mt-8">
          <h3 className="text-label text-ink-2">예시 문장으로 해 보기</h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-3 md:gap-4">
            {examples.map(({ 문장, 보류 }, i) => {
              const short = 보류 // 정답이 "판정 보류"인 예시: 문맥이 짧아 보류가 나오는 예
              return (
                <li key={문장}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onChange(문장)}
                    className={
                      'h-full w-full rounded-2xl border p-4 text-left transition-colors hover:border-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 md:p-5 ' +
                      (short ? 'border-dashed ' : '') +
                      (value === 문장 ? 'border-brand bg-brand-soft/40' : short ? 'border-pend-line bg-surface' : 'border-line bg-surface')
                    }
                  >
                    <span className="block text-label text-ink-3">
                      예시 {i + 1}
                      {short && ' · 문맥이 짧을 때'}
                    </span>
                    <span className="mt-1 block font-read text-body text-ink">{문장}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="mt-6 flex items-center gap-2 text-label font-normal text-ink-3">
        <BookIcon />
        판정과 해설은 팀이 칸트 원문과 대조해 만든 용어 DB만 근거로 합니다.
      </p>
    </div>
  )
}

// 역본 힌트 고르기: "모름" + DB의 역본들. 고르면 AI에게 단서로 함께 보낸다 (판정은 여전히 AI가 문맥으로)
function EditionPicker({ value, onChange, disabled }) {
  const options = [UNKNOWN_EDITION, ...EDITIONS]
  return (
    <fieldset className="mt-4" disabled={disabled}>
      <legend className="text-label text-ink-2">어느 번역서의 문장인가요? (선택)</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option
          return (
            <label
              key={option}
              className={
                'cursor-pointer rounded-full border px-4 py-1.5 text-label transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ' +
                (checked ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface font-normal text-ink-2 hover:border-ink-3')
              }
            >
              <input
                type="radio"
                name="edition"
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option === UNKNOWN_EDITION ? '모름' : editionLabel(option)}
            </label>
          )
        })}
      </div>
      <p className="mt-2 text-label font-normal text-ink-3">
        고르면 그 역본의 번역어 대응을 AI에게 단서로 함께 줍니다. 문맥과 어긋나면 AI가 알려 드립니다.
      </p>
    </fieldset>
  )
}

function SubmitButton({ disabled, loading, className }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-body font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <Spinner />
          분석 중…
        </>
      ) : (
        <>
          분석하기
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="shrink-0">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </svg>
  )
}
