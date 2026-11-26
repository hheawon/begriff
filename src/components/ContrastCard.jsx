import { editionLabel, isOverlapping, normalize } from '../lib/terms.js'
import { termStyle } from '../lib/termStyles.js'

const NEED_CHECK = '(확인 필요)'

// 대조 카드: 원어 하나의 원문위치 · 해설 · 구별 단서 · 역본별 번역어 (번역어 | 역본) (디자인 가이드 시안 5쪽)
// query: 지금 검색한 번역어 — 표에서 그 줄을 칠해 준다
export default function ContrastCard({ term, query = '' }) {
  const s = termStyle(term.원어)
  const q = normalize(query)

  return (
    <article className={`rounded-2xl border-t-4 bg-surface p-5 shadow-card md:p-8 ${s.topBar}`}>
      <p className="text-label text-ink-3">원어</p>
      <h3 className={`mt-2 flex items-center gap-3 font-de text-term ${s.text}`}>
        <span lang="de">{term.원어}</span>
      </h3>

      {term.원문위치.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {term.원문위치.map((위치) => (
            <span key={위치} className="rounded-full bg-line px-3 py-1 text-label text-ink-2">
              대표 원문 위치 {위치}
            </span>
          ))}
        </div>
      )}

      {term.해설.length > 0 && (
        <section className="mt-6">
          <h4 className="text-label text-ink">뜻풀이</h4>
          {term.해설.map((글) => (
            <p key={글} className="mt-2 font-read text-body text-ink">
              {글}
            </p>
          ))}
        </section>
      )}

      {term.판단단서.length > 0 && (
        <section className="mt-6 rounded-xl border border-line bg-paper p-4 md:p-5">
          <h4 className="text-label text-ink">문장에서 구별하는 단서</h4>
          <ul className="mt-2 space-y-2">
            {term.판단단서.map((단서) => (
              <li key={단서} className="flex gap-2 text-body text-ink-2">
                <span>{단서}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h4 className="text-label text-ink">역본별 번역어</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-body">
            <thead>
              <tr className="border-b-2 border-ink text-label text-ink-2">
                <th scope="col" className="py-2 pr-3">번역어</th>
                <th scope="col" className="py-2">역본</th>
              </tr>
            </thead>
            <tbody>
              {term.번역어목록.map((t, i) => (
                <tr
                  key={`${t.번역어}-${t.역본}-${i}`}
                  className={`border-b border-line ${q && normalize(t.번역어) === q ? s.row : ''}`}
                >
                  <td className="py-3 pr-3">
                    <span className="font-read">{t.번역어}</span>
                    {isOverlapping(t.번역어) && (
                      <span className="ml-2 inline-block rounded-full bg-warn-bg px-2 py-0.5 align-middle text-label text-warn-accent">
                        겹침 주의
                      </span>
                    )}
                  </td>
                  {/* "최재희, 동아출판사, 1969"처럼 띄어 써서 휴대폰에서 줄이 바뀌게 */}
                  <td className="py-3"><Value text={t.역본 && editionLabel(t.역본)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-5 text-label font-normal text-ink-3">근거: 팀 검증 용어 DB</p>
    </article>
  )
}

// 아직 채우지 않은 칸("(확인 필요)"나 빈칸)은 흐리게
function Value({ text }) {
  if (!text || text === NEED_CHECK) return <span className="text-ink-3">{text || '—'}</span>
  return text
}
