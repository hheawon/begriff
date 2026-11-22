import { termStyle } from '../lib/termStyles.js'

// 원어 표식 도형: transzendental ■ · a priori ● · transzendent ▲ (색만으로 구별하지 않기 위해)
export default function TermMarker({ 원어, size = 12, className = '' }) {
  const { shape, marker } = termStyle(원어)
  if (!shape) return null

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={`shrink-0 fill-current ${marker} ${className}`}
    >
      {shape === 'square' && <rect x="1" y="1" width="10" height="10" />}
      {shape === 'circle' && <circle cx="6" cy="6" r="5.5" />}
      {shape === 'triangle' && <polygon points="6,0.5 11.5,11 0.5,11" />}
    </svg>
  )
}
