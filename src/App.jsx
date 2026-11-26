import { useState } from 'react'
import Header from './components/Header.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import DictionaryPage from './pages/DictionaryPage.jsx'

// 탭 목록: id는 코드에서 쓰는 이름, label은 화면에 보이는 이름
const TABS = [
  { id: 'analyze', label: '문장 분석' },
  { id: 'dictionary', label: '개념어 사전' },
]

export default function App() {
  const [tab, setTab] = useState('analyze')
  // "사전에서 보기"로 넘어갈 때 사전 검색창에 넣을 단어. 바뀔 때마다 사전 화면을 새로 연다.
  const [dictionaryQuery, setDictionaryQuery] = useState({ text: '', count: 0 })

  function openDictionary(text) {
    setDictionaryQuery((q) => ({ text, count: q.count + 1 }))
    setTab('dictionary')
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen">
      <Header tabs={TABS} current={tab} onChange={setTab} />
      {/* 페이지 좌우: 모바일 20px, 데스크톱 48px / 본문 최대 폭 1200px */}
      {/* 두 탭을 모두 띄워 두고 보이는 것만 바꾼다 → 탭을 오가도 분석 결과·검색어가 남는다 */}
      <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-12 md:py-12">
        {TABS.map(({ id }) => (
          <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={tab !== id}>
            {/* 한 탭에서 오류가 나도 다른 탭과 머리말은 그대로 쓸 수 있게 탭마다 안전망 */}
            <ErrorBoundary>
              {id === 'analyze' ? (
                <AnalyzePage onOpenDictionary={openDictionary} />
              ) : (
                <DictionaryPage key={dictionaryQuery.count} initialQuery={dictionaryQuery.text} />
              )}
            </ErrorBoundary>
          </div>
        ))}
      </main>
    </div>
  )
}
