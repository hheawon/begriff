import { allTerms, isOverlapping } from './terms.js'

// 원어별 색 + 밑줄 모양 (디자인 가이드 2절). 표식 도형은 팀 결정(2026-11-23)으로 쓰지 않음 — 원어 이름은 배지에 글자로 나온다
// 색 구별은 "같은 번역어가 갈라지는 원어"에만 쓰고(아래 COLORED_ORIGINS), 나머지 원어는 중립색을 쓴다.
// Tailwind가 클래스를 찾을 수 있게 클래스 이름은 항상 통째로 적는다 (조각내서 이어 붙이지 않기).

const STYLES = {
  transzendental: {
    underline: '실선',
    text: 'text-tz-text', //       원어 글자색
    marker: 'text-tz-line', //     표식 도형 색
    chip: 'bg-tz-bg text-tz-text', // 원어 칩
    border: 'border-tz-line', //   선택된 목록 카드 테두리
    topBar: 'border-t-tz-line', // 대조 카드 위쪽 띠
    soft: 'bg-tz-bg/30', //        선택된 목록 카드 바탕
    row: 'bg-tz-bg/60', //         표에서 검색어와 같은 줄
    // 문장 속 하이라이트: 배경 + 실선 3px 밑줄
    highlight: 'bg-tz-bg underline decoration-tz-line decoration-solid decoration-[3px]',
    ring: 'ring-tz-line', //        선택된 하이라이트 테두리
    badge: 'border-tz-line bg-surface text-tz-text', //   판정 배지(외곽선)
    badgeFilled: 'border-tz-text bg-tz-text text-white', // 선택된 판정 배지(채움)
  },
  'a priori': {
    underline: '이중선',
    text: 'text-ap-text',
    marker: 'text-ap-line',
    chip: 'bg-ap-bg text-ap-text',
    border: 'border-ap-line',
    topBar: 'border-t-ap-line',
    soft: 'bg-ap-bg/30',
    row: 'bg-ap-bg/60',
    highlight: 'bg-ap-bg underline decoration-ap-line decoration-double decoration-[3px]',
    ring: 'ring-ap-line',
    badge: 'border-ap-line bg-surface text-ap-text',
    badgeFilled: 'border-ap-text bg-ap-text text-white',
  },
  transzendent: {
    underline: '물결선',
    text: 'text-tt-text',
    marker: 'text-tt-line',
    chip: 'bg-tt-bg text-tt-text',
    border: 'border-tt-line',
    topBar: 'border-t-tt-line',
    soft: 'bg-tt-bg/30',
    row: 'bg-tt-bg/60',
    highlight: 'bg-tt-bg underline decoration-tt-line decoration-wavy decoration-2',
    ring: 'ring-tt-line',
    badge: 'border-tt-line bg-surface text-tt-text',
    badgeFilled: 'border-tt-text bg-tt-text text-white',
  },
}

// 그 밖의 원어: 중립색(brand-soft + 실선 1px)
const NEUTRAL = {
  underline: '실선',
  text: 'text-ink',
  marker: 'text-ink-3',
  chip: 'bg-brand-soft text-brand border border-brand',
  border: 'border-brand',
  topBar: 'border-t-brand',
  soft: 'bg-brand-soft/40',
  row: 'bg-brand-soft',
  highlight: 'bg-brand-soft underline decoration-brand decoration-solid decoration-1',
  ring: 'ring-brand',
  badge: 'border-brand bg-surface text-brand',
  badgeFilled: 'border-brand bg-brand text-white',
}

// 판정 보류: 회색 + 점선 밑줄
export const PENDING = {
  underline: '점선',
  text: 'text-pend-text',
  marker: 'text-pend-line',
  chip: 'bg-pend-bg text-pend-text',
  border: 'border-pend-line',
  topBar: 'border-t-pend-line',
  soft: 'bg-pend-bg/40',
  row: 'bg-pend-bg',
  highlight: 'bg-pend-bg underline decoration-pend-line decoration-dotted decoration-[3px]',
  ring: 'ring-pend-line',
  badge: 'border-dashed border-pend-line bg-surface text-pend-text',
  badgeFilled: 'border-dashed border-pend-text bg-pend-bg text-pend-text',
}

// 색을 받는 원어 = 번역어가 다른 원어와 겹치는 원어 (용어 DB를 보고 자동으로 정한다. 팀 결정 2026-11-23)
// 예: '선험적'이 a priori와 transzendental 양쪽에 쓰이면 둘 다 색. '초험적'처럼 원어 하나만 가리키면 중립색.
// 다만 색이 정해진 원어(위 STYLES 3개)만 색을 받는다. 겹치는 원어가 더 생기면 팀이 가이드에 색을 추가해야 한다.
const overlappingOrigins = allTerms
  .filter((term) => term.번역어목록.some((row) => isOverlapping(row.번역어)))
  .map((term) => term.원어)

// 색 구별을 하는 원어 (범례에 쓴다)
export const COLORED_ORIGINS = Object.keys(STYLES).filter((원어) => overlappingOrigins.includes(원어))

export function termStyle(원어) {
  return COLORED_ORIGINS.includes(원어) ? STYLES[원어] : NEUTRAL
}

// AI 판정 결과 하나의 스타일: 판정 보류면 회색, 아니면 판정한 원어의 색
export function judgmentStyle(item) {
  return item.판정보류 ? PENDING : termStyle(item.판정원어)
}
