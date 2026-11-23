import { judgmentStyle } from '../lib/termStyles.js'

// 판정 배지 (디자인 가이드 시안 3·4쪽)
// 판정: "→ transzendental" / 판정 보류: "판정 보류 · 후보 transzendental / a priori"
// filled: 선택된 하이라이트의 배지는 채워서 보여준다
export default function JudgmentBadge({ item, filled = false }) {
  const s = judgmentStyle(item)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 max-w-full flex-wrap align-middle text-badge ${filled ? s.badgeFilled : s.badge}`}
    >
      {item.판정보류 ? (
        <>
          <span className="whitespace-nowrap">판정 보류 · 후보</span>
          <span lang="de" className="font-de text-body leading-none font-medium whitespace-nowrap">
            {item.후보원어.join(' / ')}
          </span>
        </>
      ) : (
        <span lang="de" className="font-de text-body leading-none font-semibold whitespace-nowrap">
          → {item.판정원어}
        </span>
      )}
    </span>
  )
}
