import { useState } from 'react'
import Header from './components/Header.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import DictionaryPage from './pages/DictionaryPage.jsx'

// 탭 목록: id는 코드에서 쓰는 이름, label은 화면에 보이는 이름
const TABS = [
  { id: 'analyze', label: '문장 분석' },
  { id: 'dictionary', label: '개념어 사전' },
]

export default function App() {
  const [tab, setTab] = useState('analyze')

  return (
    <div className="min-h-screen">
      <Header tabs={TABS} current={tab} onChange={setTab} />
      {/* 페이지 좌우: 모바일 20px, 데스크톱 48px / 본문 최대 폭 1200px */}
      <main
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mx-auto max-w-[1200px] px-5 py-8 md:px-12 md:py-12"
      >
        {tab === 'analyze' ? <AnalyzePage /> : <DictionaryPage />}
      </main>
    </div>
  )
}
