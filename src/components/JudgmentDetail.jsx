import { allTerms, editionLabel, josa } from '../lib/terms.js'
import { judgmentStyle } from '../lib/termStyles.js'
import ContrastCard from './ContrastCard.jsx'

// 하이라이트를 누르면 펼쳐지는 영역 (시안 4·8쪽 내용, 위치는 문장 카드 바로 아래)
// 위: AI의 판정 · 판정 이유 · 해설 / 아래: 3단계의 대조 카드(용어 DB)
// edition: 사용자가 고른 역본 힌트 (없으면 null)
export default function JudgmentDetail({ item, edition = null, onClose, onOpenDictionary, ref }) {
  const s = judgmentStyle(item)
  const 단어 = item.단어
  const 판정원어 = item.판정원어
  const term = allTerms.find((t) => t.원어 === 판정원어)
  // 대조 카드: 판정했으면 그 원어 하나, 판정 보류면 후보 원어 모두
  const cards = (item.판정보류 ? item.후보원어 : [판정원어])
    .map((원어) => allTerms.find((t) => t.원어 === 원어))
    .filter(Boolean)
  // 이 번역어가 다른 문헌에서 가리킬 수 있는 다른 원어
  const others = item.판정보류 ? [] : item.후보원어.filter((o) => o !== 판정원어)

  return (
    <div id="judgment-detail" ref={ref} tabIndex={-1} className="scroll-mt-6 outline-none">
      <section
        aria-label={`'${단어}' 판정 결과`}
        className={`relative rounded-2xl border border-line border-t-4 bg-surface p-5 md:p-8 ${s.topBar}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 rounded-xl border border-line bg-surface p-2 text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand md:top-6 md:right-6"
        >
          <CloseIcon />
        </button>

        <p className="pr-12 text-label text-ink-2">
          {item.판정보류
            ? `이 문장의 '${단어}' — 원어 판정 보류`
            : `이 문장의 '${단어}'${josa(단어, '이', '가')} 가리키는 원어`}
        </p>

        {item.판정보류 ? (
          <h3 className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-h2 ${s.text}`}>
            <span className="flex items-center gap-3 whitespace-nowrap">
              판정 보류
            </span>
            <span className="text-body font-normal text-ink-2">
              후보{' '}
              <span lang="de" className="font-de font-medium">{item.후보원어.join(' / ')}</span>
            </span>
          </h3>
        ) : (
          <h3 className={`mt-2 flex items-center gap-3 font-de text-term ${s.text}`}>
            <span lang="de">{판정원어}</span>
          </h3>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {term?.원문위치.map((위치) => (
            <span key={위치} className="rounded-full bg-line px-3 py-1 text-label text-ink-2">
              원문 위치 {위치}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-3 py-1 text-label text-ink-2">
            <ConfidenceBars level={item.확신도} />
            AI 확신 {item.확신도}
          </span>
        </div>

        {item.판정보류 && (
          <p className="mt-5 rounded-xl border border-dashed border-pend-line bg-pend-bg/50 p-4 text-body text-pend-text">
            문맥만으로는 원어를 정할 근거가 부족합니다. 앞뒤 문장을 함께 넣으면 다시 판정합니다.
          </p>
        )}

        {edition && item.역본기준원어 && <EditionNote item={item} edition={edition} />}

        {item.판정이유 && (
          <section className="mt-6">
            <h4 className="text-label text-ink">판정 이유</h4>
            <p className="mt-2 font-read text-body text-ink">{item.판정이유}</p>
          </section>
        )}

        {item.해설 && (
          <section className="mt-6">
            <h4 className="text-label text-ink">해설</h4>
            <p className="mt-2 font-read text-body text-ink">{item.해설}</p>
          </section>
        )}

        {others.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-warn-bg p-4 text-warn-text md:flex-row md:items-center md:justify-between md:px-5">
            <p className="flex items-start gap-2 text-body font-semibold">
              <WarningIcon />
              <span>
                다른 문헌에서는 '{단어}'{josa(단어, '이', '가')}{' '}
                {others.map((o, i) => (
                  <span key={o}>
                    {i > 0 && ', '}
                    <span lang="de" className="font-de">{o}</span>
                  </span>
                ))}
                의 번역어로도 쓰입니다.
              </span>
            </p>
            <button
              type="button"
              onClick={() => onOpenDictionary(단어)}
              className="self-start rounded-lg px-1 text-label whitespace-nowrap text-warn-accent underline underline-offset-4 hover:text-warn-text focus-visible:outline-2 focus-visible:outline-warn-accent md:self-auto"
            >
              사전에서 비교
            </button>
          </div>
        )}

        <p className="mt-5 text-label font-normal text-ink-3">
          판정 이유·해설: AI가 팀 검증 용어 DB만 근거로 작성 · 아래 대조 카드는 DB 원문 그대로
        </p>
      </section>

      <div className="mt-4 space-y-4">
        {cards.map((card) => (
          <ContrastCard key={card.원어} term={card} query={단어} />
        ))}
      </div>
    </div>
  )
}


// 역본 힌트와 AI 판정 비교: 다르면 경고, 같으면 한 줄 확인, 보류면 역본 기준만 안내
function EditionNote({ item, edition }) {
  const 단어 = item.단어
  const 기준 = <span lang="de" className="font-de font-medium">{item.역본기준원어}</span>
  const 역본 = editionLabel(edition)

  if (item.역본불일치) {
    return (
      <div role="note" className="mt-5 flex items-start gap-2 rounded-xl border border-ap-line bg-ap-bg/40 p-4 text-body text-ink">
        <WarningIcon className="mt-1 text-ap-line" />
        <p>
          선택한 역본({역본})에서는 '{단어}'{josa(단어, '을', '를')} {기준}의 번역어로 씁니다. 그런데 AI는 이 문장의 문맥을 근거로 다른 원어를 골랐습니다:{' '}
          <span lang="de" className="font-de font-medium">{item.판정원어}</span>.{' '}
          <strong className="font-semibold">역본을 잘못 고르지 않았는지 확인해 보세요.</strong>
        </p>
      </div>
    )
  }
  return (
    <p className="mt-5 text-label font-normal text-ink-2">
      {item.판정보류
        ? <>선택한 역본({역본})에서는 '{단어}'{josa(단어, '을', '를')} {기준}의 번역어로 씁니다. 문맥만으로는 확정하지 못했습니다.</>
        : <>선택한 역본({역본})의 번역어 대응과 일치합니다.</>}
    </p>
  )
}

// 확신도 막대 3칸: 높음 3 · 중간 2 · 낮음 1
function ConfidenceBars({ level }) {
  const filled = { 높음: 3, 중간: 2, 낮음: 1 }[level] ?? 1
  return (
    <svg aria-hidden="true" width="16" height="12" viewBox="0 0 16 12" className="text-brand">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 6} y="0" width="4" height="12" rx="1" fill="currentColor" opacity={i < filled ? 1 : 0.25} />
      ))}
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function WarningIcon({ className = 'mt-1 text-warn-accent' }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="M12 3 2 21h20L12 3z" />
      <path d="M12 10v5M12 18v.5" strokeLinecap="round" />
    </svg>
  )
}
