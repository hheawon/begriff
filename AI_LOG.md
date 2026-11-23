# AI 사용 기록

| 날짜 | 사용 도구 | 한 일 |
|---|---|---|
| 2026-11-19 | Claude Code (Claude Opus 5.5) | 프로젝트 뼈대 생성(React+Vite+Tailwind), 디자인 가이드 v0.1을 Tailwind 토큰으로 등록, 헤더·탭 빈 화면 제작 |
| 2026-11-22 | Claude Code (Claude Opus 5.5) | 용어 DB 양식(CSV) 설계, CSV→JSON 변환 스크립트(Node.js, UTF-8·BOM 처리) 작성, 샘플 용어 3개·테스트 문장 형식 작성, README에 DB 갱신 방법 정리 |
| 2026-11-22 | Claude Code (Claude Opus 5.5) | 개념어 사전 화면 제작(원어·번역어 검색, 대조 카드, 같은 번역어·다른 원어 경고 상자, 모바일 아코디언), 디자인 가이드 시안 5·9쪽 반영 |
| 2026-11-22 | Claude Code (Claude Opus 5.5) | GitHub 공개 저장소 업로드 전 비밀정보 점검, Vercel 연결 및 첫 배포(begriff-green.vercel.app), push 시 자동 재배포 확인 |
| 2026-11-22 | Claude Code (Claude Opus 5.5) | AI 문장 분석 API(/api/analyze) 제작: Gemini 공식 SDK(@google/genai, gemini-3.5-flash-lite) 구조화 출력, 용어 DB 근거 프롬프트, 서버 측 검사(위치 계산·판정 보류·DB 출처 자동 첨부), 개발 서버 연결, 테스트 스크립트 |
| 2026-11-22 | Claude Code (Claude Opus 5.5) | Vercel 환경변수(GEMINI_API_KEY) 등록 안내, 배포 사이트에서 /api/analyze 실제 동작 확인 |
| 2026-11-23 | Claude Code (Claude Opus 5.5) | 문장 분석 화면 제작: 입력창·예시 문장 3개, /api/analyze 연결(로딩·한국어 에러·30초 제한), 원어별 하이라이트·판정 배지·판정 보류 표시, 판정 이유·해설+대조 카드 펼침, 같은 번역어·다른 원어 경고와 사전 연결, 휴대폰·PC 화면 브라우저 확인 |
