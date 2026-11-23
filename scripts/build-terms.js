// 용어 DB 변환 스크립트
// 팀이 스프레드시트에서 저장한 CSV(data/terms.csv)를 앱이 읽는 JSON(data/terms.json)으로 바꾼다.
//
// 실행 (PowerShell):  npm run build:terms
// 다른 파일로 시험:   node scripts/build-terms.js 입력.csv 출력.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSV나누기, CSV읽기, 머리글확인, 멈추기 } from './csv.js';

const 프로젝트폴더 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const 입력경로 = path.resolve(process.argv[2] ?? path.join(프로젝트폴더, 'data', 'terms.csv'));
const 출력경로 = path.resolve(process.argv[3] ?? path.join(프로젝트폴더, 'data', 'terms.json'));

// 스프레드시트 열 순서. data/terms-template.csv의 머리글과 같아야 한다.
const 열목록 = ['원어', '번역어', '역본', '원문위치', '해설', '판단단서'];

function 중복없이추가(목록, 값) {
  if (값 && !목록.includes(값)) 목록.push(값);
}

// 1·2. 파일 읽기, 머리글 확인 (공용 함수: scripts/csv.js)
const 줄들 = CSV나누기(CSV읽기(입력경로));
머리글확인(줄들, 열목록, 'data/terms-template.csv');

// 3. 한 줄씩 검사하면서 같은 원어끼리 묶기
const 원어별 = new Map();
let 번역어수 = 0;

for (const { 줄번호, 칸들 } of 줄들.slice(1)) {
  if (칸들.length !== 열목록.length) {
    멈추기(`${줄번호}번째 줄: 칸이 ${열목록.length}개여야 하는데 ${칸들.length}개입니다. 쉼표가 들어간 칸이 따옴표로 감싸졌는지 확인하세요.`);
  }

  const 행 = Object.fromEntries(열목록.map((열, i) => [열, 칸들[i].trim()]));
  if (!행.원어) 멈추기(`${줄번호}번째 줄: "원어" 칸이 비어 있습니다.`);
  if (!행.번역어) 멈추기(`${줄번호}번째 줄: "번역어" 칸이 비어 있습니다.`);

  if (!원어별.has(행.원어)) {
    원어별.set(행.원어, { 원어: 행.원어, 원문위치: [], 해설: [], 판단단서: [], 번역어목록: [] });
  }
  const 묶음 = 원어별.get(행.원어);
  중복없이추가(묶음.원문위치, 행.원문위치);
  중복없이추가(묶음.해설, 행.해설);
  중복없이추가(묶음.판단단서, 행.판단단서);
  묶음.번역어목록.push({ 번역어: 행.번역어, 역본: 행.역본 });
  번역어수++;
}

// 4. JSON 저장 (BOM 없는 UTF-8)
const 결과 = [...원어별.values()];
fs.writeFileSync(출력경로, JSON.stringify(결과, null, 2) + '\n', 'utf8');

console.log(`완료: 원어 ${결과.length}개, 번역어 ${번역어수}개 → ${path.relative(process.cwd(), 출력경로) || 출력경로}`);
