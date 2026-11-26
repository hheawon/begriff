import { Component } from 'react'
import { WarningIcon } from './JudgmentDetail.jsx'

// 안전망: 안쪽 화면에서 예상 못 한 오류가 나도 앱 전체가 하얗게 멈추지 않게,
// 그 자리에 한국어 안내와 "다시 시도"·"새로고침" 버튼을 보여준다. (시연 안정화, 8단계)
// React에서 이 기능은 클래스 컴포넌트로만 만들 수 있다.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('[화면 오류]', error, info?.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-ink-3 bg-surface p-4 md:flex-row md:items-center md:justify-between md:px-5">
        <p className="flex items-start gap-2 text-body text-ink">
          <WarningIcon className="mt-1 text-ap-line" />
          <span>화면을 보여주는 중에 문제가 생겼습니다. 다시 시도하거나 새로고침해 주세요.</span>
        </p>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="rounded-xl border border-brand px-4 py-2 text-label whitespace-nowrap text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand px-4 py-2 text-label whitespace-nowrap text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }
}
