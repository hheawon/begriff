import Tabs from './Tabs.jsx'

// 화면 맨 위: 로고 + 앱 이름 + 부제 + 탭
// 모바일: 탭이 아래 줄 전체 폭 / 데스크톱(md): 탭이 오른쪽
export default function Header({ tabs, current, onChange }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-lg bg-brand font-de text-[26px] leading-none text-white md:size-12 md:text-[30px]"
          >
            B
          </div>
          <div>
            <h1 className="text-display">베그리프</h1>
            <p className="text-label text-ink-3">칸트 개념어 대조 도우미</p>
          </div>
        </div>
        <Tabs tabs={tabs} current={current} onChange={onChange} />
      </div>
    </header>
  )
}
