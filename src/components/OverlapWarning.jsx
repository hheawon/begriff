import { josa } from '../lib/terms.js'
import { termStyle } from '../lib/termStyles.js'
import TermMarker from './TermMarker.jsx'

// 같은 번역어가 여러 원어를 가리킬 때 띄우는 어두운 경고 상자 (디자인 가이드 3절, 시안 5·9쪽)
// 앱에서 유일하게 어두운 면을 쓰는 곳 — 이 앱의 핵심 메시지
const CHIP_H = 36 // 원어 칩 높이(px)
const CHIP_GAP = 8 // 칩 사이 간격(px)

export default function OverlapWarning({ 번역어, 원어목록 }) {
  const height = 원어목록.length * CHIP_H + (원어목록.length - 1) * CHIP_GAP

  return (
    <section
      role="note"
      aria-label={`'${번역어}'${josa(번역어, '은', '는')} 여러 원어를 가리킵니다`}
      className="flex flex-col gap-5 rounded-2xl bg-warn-bg p-5 text-warn-text md:flex-row md:items-center md:justify-between md:gap-8 md:p-8"
    >
      <div className="md:max-w-[60%]">
        <p className="flex items-center gap-2 text-label text-warn-accent">
          <WarningIcon />
          같은 번역어, 다른 원어
        </p>
        <p className="mt-3 text-h2">
          '{번역어}'{josa(번역어, '은', '는')} 문헌에 따라{' '}
          {원어목록.map((원어, i) => (
            <span key={원어}>
              {i > 0 && (i === 원어목록.length - 1 ? ' 또는 ' : ', ')}
              <span className="font-de font-medium">{원어}</span>
            </span>
          ))}
          , 서로 다른 원어를 가리킵니다.
        </p>
        <p className="mt-3 text-body text-warn-text/80">
          두 문헌을 함께 읽으면 같은 단어가 전혀 다른 개념을 가리킬 수 있습니다. 지금 읽는 역본의 번역어 방침을 먼저 확인하세요.
        </p>
      </div>

      {/* 그림: [번역어] ⟨ 원어 칩들 */}
      <div className="flex items-center" aria-hidden="true">
        <span className="rounded-xl border border-warn-text/40 px-4 py-2 font-read text-h2 font-normal">
          {번역어}
        </span>
        <svg width="36" height={height} className="shrink-0 text-warn-text/60" fill="none">
          {원어목록.map((원어, i) => {
            const y = i * (CHIP_H + CHIP_GAP) + CHIP_H / 2
            return (
              <path
                key={원어}
                d={`M0 ${height / 2} C 18 ${height / 2}, 18 ${y}, 36 ${y}`}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            )
          })}
        </svg>
        <div className="flex flex-col" style={{ gap: CHIP_GAP }}>
          {원어목록.map((원어) => (
            <span
              key={원어}
              style={{ height: CHIP_H }}
              className={`inline-flex items-center gap-2 rounded-full px-4 font-de text-body font-medium ${termStyle(원어).chip}`}
            >
              <TermMarker 원어={원어} size={10} />
              {원어}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 3 2 21h20L12 3z" />
      <path d="M12 10v5M12 18v.5" strokeLinecap="round" />
    </svg>
  )
}
