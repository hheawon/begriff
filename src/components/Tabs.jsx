// 탭: line색 트랙 위에 선택된 탭만 흰색으로 뜬다 (디자인 가이드 시안 2·6쪽)
export default function Tabs({ tabs, current, onChange }) {
  // 키보드 ← → 로 탭 이동
  function handleKeyDown(e) {
    const i = tabs.findIndex((t) => t.id === current)
    let next = null
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length]
    if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length]
    if (next) {
      e.preventDefault()
      onChange(next.id)
      document.getElementById(`tab-${next.id}`)?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-label="화면 선택"
      onKeyDown={handleKeyDown}
      className="flex rounded-xl bg-line p-1"
    >
      {tabs.map((t) => {
        const selected = t.id === current
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={
              'flex-1 rounded-lg px-4 py-2 text-label whitespace-nowrap transition-colors md:flex-none md:px-5 ' +
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
              (selected ? 'bg-surface text-ink' : 'text-ink-2 hover:text-ink')
            }
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
