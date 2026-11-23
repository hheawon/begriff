import { PENDING, termStyle } from '../lib/termStyles.js'

// 원어 표식 도형: transzendental ■ · a priori ● · transzendent ▲ · 판정 보류 ◌ (색만으로 구별하지 않기 위해)
// pending: 판정 보류 표식(점선 원)을 그린다
// plain: 표식 색을 따로 칠하지 않고 바깥 글자색을 따른다 (채운 배지 안에서)
export default function TermMarker({ 원어, pending = false, plain = false, size = 12, className = '' }) {
  const { shape, marker } = pending ? PENDING : termStyle(원어)
  if (!shape) return null

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={`shrink-0 fill-current ${plain ? '' : marker} ${className}`}
    >
      {shape === 'square' && <rect x="1" y="1" width="10" height="10" />}
      {shape === 'circle' && <circle cx="6" cy="6" r="5.5" />}
      {shape === 'triangle' && <polygon points="6,0.5 11.5,11 0.5,11" />}
      {shape === 'dashed-circle' && (
        <circle cx="6" cy="6" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.8" />
      )}
    </svg>
  )
}
