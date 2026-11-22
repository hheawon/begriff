// 원어별 색 + 표식 도형 (디자인 가이드 2절)
// 색 구별은 "같은 번역어가 갈라지는 원어" 3개에만 쓰고, 나머지 원어는 중립색을 쓴다.
// Tailwind가 클래스를 찾을 수 있게 클래스 이름은 항상 통째로 적는다 (조각내서 이어 붙이지 않기).

const STYLES = {
  transzendental: {
    shape: 'square',
    text: 'text-tz-text', //       원어 글자색
    marker: 'text-tz-line', //     표식 도형 색
    chip: 'bg-tz-bg text-tz-text', // 원어 칩
    border: 'border-tz-line', //   선택된 목록 카드 테두리
    topBar: 'border-t-tz-line', // 대조 카드 위쪽 띠
    soft: 'bg-tz-bg/30', //        선택된 목록 카드 바탕
    row: 'bg-tz-bg/60', //         표에서 검색어와 같은 줄
  },
  'a priori': {
    shape: 'circle',
    text: 'text-ap-text',
    marker: 'text-ap-line',
    chip: 'bg-ap-bg text-ap-text',
    border: 'border-ap-line',
    topBar: 'border-t-ap-line',
    soft: 'bg-ap-bg/30',
    row: 'bg-ap-bg/60',
  },
  transzendent: {
    shape: 'triangle',
    text: 'text-tt-text',
    marker: 'text-tt-line',
    chip: 'bg-tt-bg text-tt-text',
    border: 'border-tt-line',
    topBar: 'border-t-tt-line',
    soft: 'bg-tt-bg/30',
    row: 'bg-tt-bg/60',
  },
}

// 그 밖의 원어: 중립색(brand-soft + 실선 1px), 표식 도형 없음
const NEUTRAL = {
  shape: null,
  text: 'text-ink',
  marker: 'text-ink-3',
  chip: 'bg-brand-soft text-brand border border-brand',
  border: 'border-brand',
  topBar: 'border-t-brand',
  soft: 'bg-brand-soft/40',
  row: 'bg-brand-soft',
}

export function termStyle(원어) {
  return STYLES[원어] ?? NEUTRAL
}
