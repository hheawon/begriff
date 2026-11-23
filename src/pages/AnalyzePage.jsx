import { useEffect, useRef, useState } from 'react'
import testSentences from '../../data/test-sentences.json'
import { allTerms, editionLabel, josa } from '../lib/terms.js'
import { judgmentStyle } from '../lib/termStyles.js'
import { AnalyzeError, requestAnalysis } from '../lib/analyzeApi.js'
import AnalyzeForm, { UNKNOWN_EDITION } from '../components/AnalyzeForm.jsx'
import HighlightedSentence from '../components/HighlightedSentence.jsx'
import JudgmentDetail, { WarningIcon } from '../components/JudgmentDetail.jsx'
import TermMarker from '../components/TermMarker.jsx'

// 예시 문장 버튼: test-sentences.json의 앞 3개 문장
const EXAMPLES = testSentences.slice(0, 3).map((t) => t.문장)

// "문장 분석" 탭 (디자인 가이드 시안 2·3·6·7쪽)
// 입력 화면 → (분석하기) → 결과 화면. 하이라이트를 누르면 문장 카드 아래에 판정·대조 카드가 펼쳐진다.
// onOpenDictionary(번역어): 개념어 사전 탭으로 가서 그 번역어를 검색
export default function AnalyzePage({ onOpenDictionary }) {
  const [text, setText] = useState('')
  const [edition, setEdition] = useState(UNKNOWN_EDITION) // 역본 힌트 ('모름' = 힌트 없음)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { 문장, 개념어목록 }
  const [selected, setSelected] = useState(null) // 펼친 개념어 번호

  async function analyze() {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const data = await requestAnalysis(text.trim(), edition === UNKNOWN_EDITION ? null : edition)
      setResult(data)
      setSelected(null)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err instanceof AnalyzeError ? err.message : '알 수 없는 문제가 생겼습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  function changeText(value) {
    setText(value)
    setError('')
  }

  if (result) {
    return (
      <AnalysisResult
        result={result}
        selected={selected}
        onSelect={(i) => setSelected((cur) => (cur === i ? null : i))}
        onClose={() => setSelected(null)}
        onBack={() => {
          setResult(null) // 입력한 문장은 그대로 남겨 둔다
          setSelected(null)
          window.scrollTo({ top: 0 })
        }}
        onOpenDictionary={onOpenDictionary}
      />
    )
  }

  return (
    <section>
      <h2 className="text-h2">읽다가 막힌 문장을 붙여 넣으세요</h2>
      <p className="mt-2 text-body text-ink-2">
        『순수이성비판』 번역 문장 속 개념어가 어떤 독일어 원어를 가리키는지 판정하고, 역본별 번역어를 근거와 함께 보여드립니다.
      </p>
      <div className="mt-6">
        <AnalyzeForm
          value={text}
          onChange={changeText}
          onSubmit={analyze}
          loading={loading}
          error={error}
          examples={EXAMPLES}
          edition={edition}
          onEditionChange={(value) => {
            setEdition(value)
            setError('')
          }}
        />
      </div>
    </section>
  )
}

// ── 결과 화면 ─────────────────────────────
function AnalysisResult({ result, selected, onSelect, onClose, onBack, onOpenDictionary }) {
  const items = result.개념어목록
  const judged = items.filter((it) => !it.판정보류).length
  const detailRef = useRef(null)
  const active = selected !== null ? items[selected] : null

  // 펼치면 그 자리가 보이도록 스크롤 (아래 "찾은 개념어" 목록에서 눌렀을 때 특히)
  useEffect(() => {
    if (selected !== null) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected])

  return (
    <section>
      <h2 className="sr-only">분석 결과</h2>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-lg py-1 text-label text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          다른 문장 분석
        </button>
        <p className="text-label font-normal text-ink-2" aria-live="polite">
          {result.역본 && <>역본 힌트 <strong className="font-semibold text-ink">{editionLabel(result.역본)}</strong> · </>}
          개념어 <strong className="font-semibold text-ink">{items.length}개</strong>
          {items.length > 0 && (
            <>
              {' '}찾음 (판정 {judged} · 보류 {items.length - judged}) · 하이라이트를 누르면 대조 카드가 펼쳐집니다
            </>
          )}
        </p>
      </div>

      <HighlightedSentence 문장={result.문장} items={items} selected={selected} onSelect={onSelect} />

      {active && (
        <div className="mt-4">
          <JudgmentDetail ref={detailRef} item={active} edition={result.역본} onClose={onClose} onOpenDictionary={onOpenDictionary} />
        </div>
      )}

      {splitWords(items).map(({ 단어, 원어목록 }) => (
        <SplitWarning key={단어} 단어={단어} 원어목록={원어목록} onOpenDictionary={onOpenDictionary} />
      ))}

      <h3 className="mt-8 mb-3 text-h2">찾은 개념어</h3>
      {items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-body text-ink-2">
          이 문장에서 용어 DB에 있는 개념어를 찾지 못했습니다. 개념어가 들어 있는 다른 문장으로 해 보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={`${item.위치.시작}-${item.단어}`}>
              <FoundTermRow item={item} active={selected === i} onClick={() => onSelect(i)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// 한 문장 안에서 같은 번역어가 서로 다른 원어로 판정된 경우 찾기 (문장 앞쪽부터 나온 순서대로)
function splitWords(items) {
  const byWord = new Map()
  for (const it of items) {
    if (it.판정보류) continue
    const list = byWord.get(it.단어) ?? []
    if (!list.includes(it.판정원어)) list.push(it.판정원어)
    byWord.set(it.단어, list)
  }
  return [...byWord]
    .map(([단어, 원어목록]) => ({ 단어, 원어목록 }))
    .filter((w) => w.원어목록.length >= 2)
}

// 핵심 경고: "이 문장의 '선험적'은 서로 다른 원어로 쓰였습니다" (시안 3·7쪽)
function SplitWarning({ 단어, 원어목록, onOpenDictionary }) {
  return (
    <div
      role="note"
      className="mt-4 flex flex-col gap-4 rounded-2xl bg-warn-bg p-5 text-warn-text md:flex-row md:items-center md:justify-between md:px-8"
    >
      <div>
        <p className="flex items-center gap-2 text-label text-warn-accent">
          <WarningIcon className="text-warn-accent" />
          같은 번역어, 다른 원어
        </p>
        <p className="mt-2 text-h2">
          이 문장의 '{단어}'{josa(단어, '은', '는')} 서로 다른 원어로 쓰였습니다.
        </p>
        <p className="mt-1 text-body text-warn-text/80">
          앞에서부터{' '}
          {원어목록.map((원어, i) => (
            <span key={원어}>
              {i > 0 && ' → '}
              <span lang="de" className="font-de font-medium">{원어}</span>
            </span>
          ))}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onOpenDictionary(단어)}
        className="self-start rounded-xl border border-warn-accent px-4 py-2 text-label whitespace-nowrap text-warn-accent hover:bg-warn-accent hover:text-warn-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warn-accent md:self-auto"
      >
        사전에서 '{단어}' 보기
      </button>
    </div>
  )
}

// 찾은 개념어 한 줄: 단어 · 원어 칩 · 원문 위치 · 확신도
function FoundTermRow({ item, active, onClick }) {
  const s = judgmentStyle(item)
  const 위치 = item.판정보류 ? null : allTerms.find((t) => t.원어 === item.판정원어)?.원문위치.join(', ')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-controls="judgment-detail"
      className={
        'flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:px-6 ' +
        (active ? `${s.border} ${s.soft}` : 'border-line bg-surface hover:border-ink-3')
      }
    >
      <span className="font-read text-h2 font-normal">{item.단어}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 ${s.chip}`}>
        <TermMarker 원어={item.판정원어} pending={item.판정보류} size={10} />
        {item.판정보류 ? (
          <span className="text-badge">판정 보류</span>
        ) : (
          <span lang="de" className="font-de text-body font-medium">{item.판정원어}</span>
        )}
      </span>
      <span className="text-label font-normal text-ink-2">
        {item.판정보류 ? (
          <>
            후보 <span lang="de" className="font-de text-body">{item.후보원어.join(' / ')}</span>
          </>
        ) : (
          <>
            {위치 && `원문 ${위치} · `}확신 {item.확신도}
          </>
        )}
        {item.역본불일치 && (
          <span className="ml-2 inline-flex items-center gap-1 text-ap-text">
            <WarningIcon className="text-ap-line" />
            선택한 역본과 다름
          </span>
        )}
      </span>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto shrink-0 text-ink-3 transition-transform ${active ? 'rotate-90' : ''}`}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  )
}
