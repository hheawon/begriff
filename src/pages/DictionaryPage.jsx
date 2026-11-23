import { useRef, useState } from 'react'
import { allTerms, josa, searchTerms, translationsOf } from '../lib/terms.js'
import { termStyle } from '../lib/termStyles.js'
import ContrastCard from '../components/ContrastCard.jsx'
import OverlapWarning from '../components/OverlapWarning.jsx'
import TermMarker from '../components/TermMarker.jsx'

// "개념어 사전" 탭 (디자인 가이드 시안 5쪽 데스크톱 · 9쪽 모바일)
// 데스크톱: 왼쪽 원어 목록 + 오른쪽 대조 카드 / 모바일: 목록 카드를 누르면 그 아래에 펼쳐짐
// initialQuery: 문장 분석 화면의 "사전에서 보기"로 왔을 때 처음 검색어
export default function DictionaryPage({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [selected, setSelected] = useState(null) // 사용자가 누른 원어 (없으면 첫 결과)
  const [collapsed, setCollapsed] = useState(initialQuery.trim() === '') // 모바일: 카드가 접혀 있는가
  const inputRef = useRef(null)

  const { results, others, overlap } = searchTerms(query)
  const trimmed = query.trim()
  const noResult = trimmed !== '' && results.length === 0

  // 결과가 없으면 전체 목록을 "전체 개념어"로 보여준다
  const mainList = noResult ? allTerms : results
  const restList = noResult ? [] : others
  const active =
    [...mainList, ...restList].find((t) => t.원어 === selected) ?? mainList[0] ?? null

  function changeQuery(value) {
    setQuery(value)
    setSelected(null) // 검색어가 바뀌면 첫 결과를 다시 보여준다
    setCollapsed(value.trim() === '') // 검색했으면 모바일에서도 첫 카드를 펼쳐 둔다
  }

  function pick(term) {
    if (active && term.원어 === active.원어) {
      setCollapsed((c) => !c) // 모바일: 펼친 카드를 다시 누르면 접기
    } else {
      setSelected(term.원어)
      setCollapsed(false)
    }
  }

  let mainTitle = `전체 개념어 ${allTerms.length}`
  if (overlap) mainTitle = `'${overlap.번역어}'${josa(overlap.번역어, '으로', '로')} 옮겨지는 원어 ${results.length}`
  else if (trimmed && !noResult) mainTitle = `'${trimmed}' 검색 결과 ${results.length}`

  const renderList = (list) => (
    <ul className="space-y-3">
      {list.map((term) => {
        const isActive = active?.원어 === term.원어
        const expanded = isActive && !collapsed
        return (
          <li key={term.원어}>
            <TermListItem term={term} active={isActive} expanded={expanded} onClick={() => pick(term)} />
            {/* 모바일 전용: 목록 바로 아래에 펼쳐지는 대조 카드 */}
            {expanded && (
              <div id={`card-${term.원어}`} className="mt-3 md:hidden">
                <ContrastCard term={term} query={trimmed} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <section>
      <h2 className="sr-only">개념어 사전</h2>

      {/* 검색창 */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          inputRef.current?.blur() // 휴대폰 키보드 닫기 (결과는 입력하는 즉시 바뀐다)
        }}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2 pl-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft"
      >
        <SearchIcon />
        <label htmlFor="dictionary-search" className="sr-only">
          개념어 검색
        </label>
        <input
          ref={inputRef}
          id="dictionary-search"
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="원어나 번역어로 검색 (예: 선험적, transzendental)"
          className="min-w-0 flex-1 bg-transparent py-2 text-body text-ink outline-none placeholder:text-ink-3"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              changeQuery('')
              inputRef.current?.focus()
            }}
            aria-label="검색어 지우기"
            className="rounded-lg p-2 text-ink-3 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <CloseIcon />
          </button>
        )}
        <button
          type="submit"
          className="hidden rounded-lg bg-brand px-5 py-2 text-label text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:block"
        >
          검색
        </button>
      </form>

      {/* 핵심: 같은 번역어가 여러 원어를 가리킬 때 */}
      {overlap && (
        <div className="mt-4 md:mt-6">
          <OverlapWarning 번역어={overlap.번역어} 원어목록={overlap.원어목록} />
        </div>
      )}

      {noResult && (
        <p className="mt-4 rounded-xl border border-line bg-surface p-4 text-body text-ink-2 md:mt-6">
          '{trimmed}'에 해당하는 개념어가 없습니다. 원어(예: transzendental)나 번역어(예: 선험적)로 찾아 보세요.
        </p>
      )}

      <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start md:gap-6">
        {/* 왼쪽(모바일은 전체): 원어 목록 */}
        <div>
          <h3 className="mb-3 text-label text-ink-2" aria-live="polite">
            {mainTitle}
          </h3>
          {renderList(mainList)}

          {restList.length > 0 && (
            <>
              <h3 className="mt-6 mb-3 text-label text-ink-2">다른 개념어</h3>
              {renderList(restList)}
            </>
          )}
        </div>

        {/* 오른쪽: 데스크톱 전용 대조 카드 */}
        {active && (
          <div className="hidden md:sticky md:top-6 md:block">
            <ContrastCard term={active} query={trimmed} />
          </div>
        )}
      </div>
    </section>
  )
}

// 목록 카드: 표식 + 원어 + 번역어들
function TermListItem({ term, active, expanded, onClick }) {
  const s = termStyle(term.원어)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={`card-${term.원어}`}
      className={
        'w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
        (active ? `${s.border} ${s.soft}` : 'border-line bg-surface hover:border-ink-3')
      }
    >
      <span className="flex items-center gap-2">
        <TermMarker 원어={term.원어} size={12} />
        <span lang="de" className={`font-de text-h2 font-medium ${s.text}`}>
          {term.원어}
        </span>
        {active && <span className={`ml-auto hidden text-label md:inline ${s.text}`}>보는 중</span>}
        <ChevronIcon className={`ml-auto text-ink-3 transition-transform md:hidden ${expanded ? 'rotate-180' : ''}`} />
      </span>
      <span className="mt-1 block text-body text-ink-2">{translationsOf(term).join(' · ')}</span>
    </button>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-3">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" strokeLinecap="round" />
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

function ChevronIcon({ className = '' }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
