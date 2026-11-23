// 테스트 문장 변환 스크립트
// 팀이 스프레드시트에서 저장한 CSV(data/test-sentences.csv)를 앱이 읽는 JSON(data/test-sentences.json)으로 바꾼다.
// 이 JSON은 정확도 평가(7단계)와 문장 분석 화면의 "예시 문장" 버튼(중복 없이 앞의 문장 3개)에 쓰인다.
//
// 실행 (PowerShell):  npm run build:tests

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSV나누기, CSV읽기, 머리글확인, 멈추기 } from './csv.js';

const 프로젝트폴더 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const 입력경로 = path.resolve(process.argv[2] ?? path.join(프로젝트폴더, 'data', 'test-sentences.csv'));
const 출력경로 = path.resolve(process.argv[3] ?? path.join(프로젝트폴더, 'data', 'test-sentences.json'));
const 용어경로 = path.join(프로젝트폴더, 'data', 'terms.json');

// 스프레드시트 열 순서. data/test-sentences-template.csv의 머리글과 같아야 한다.
const 열목록 = ['문장', '개념어', '정답원어', '출처'];
const 보류 = '판정 보류';

// 용어 DB: 개념어(번역어)와 정답원어(원어)가 DB에 있는지 확인하는 데 쓴다
const 용어 = JSON.parse(fs.readFileSync(용어경로, 'utf8'));
const 원어목록 = 용어.map((t) => t.원어);
const 번역어목록 = new Set(용어.flatMap((t) => t.번역어목록.map((r) => r.번역어)));

const 줄들 = CSV나누기(CSV읽기(입력경로));
머리글확인(줄들, 열목록, 'data/test-sentences-template.csv');

const 결과 = [];
for (const { 줄번호, 칸들 } of 줄들.slice(1)) {
  if (칸들.length !== 열목록.length) {
    멈추기(`${줄번호}번째 줄: 칸이 ${열목록.length}개여야 하는데 ${칸들.length}개입니다. 쉼표가 들어간 칸이 따옴표로 감싸졌는지 확인하세요.`);
  }
  const 행 = Object.fromEntries(열목록.map((열, i) => [열, 칸들[i].trim()]));

  for (const 열 of ['문장', '개념어', '정답원어']) {
    if (!행[열]) 멈추기(`${줄번호}번째 줄: "${열}" 칸이 비어 있습니다.`);
  }
  if (!번역어목록.has(행.개념어)) {
    멈추기(`${줄번호}번째 줄: 개념어 "${행.개념어}"가 용어 DB(terms.csv)의 번역어에 없습니다. 조사를 빼고 DB와 똑같이 적으세요.`);
  }
  if (!행.문장.includes(행.개념어)) {
    멈추기(`${줄번호}번째 줄: 문장 안에 개념어 "${행.개념어}"가 없습니다.`);
  }
  if (!원어목록.includes(행.정답원어) && 행.정답원어 !== 보류) {
    멈추기(
      `${줄번호}번째 줄: 정답원어 "${행.정답원어}"가 용어 DB의 원어와 다릅니다.\n` +
        `  쓸 수 있는 값: ${[...원어목록, 보류].join(', ')}`,
    );
  }
  결과.push(행);
}

if (결과.length === 0) 멈추기('머리글 아래에 문장이 하나도 없습니다.');

// JSON 저장 (BOM 없는 UTF-8)
fs.writeFileSync(출력경로, JSON.stringify(결과, null, 2) + '\n', 'utf8');

const 문장수 = new Set(결과.map((r) => r.문장)).size;
console.log(`완료: ${결과.length}줄 (서로 다른 문장 ${문장수}개) → ${path.relative(process.cwd(), 출력경로) || 출력경로}`);
console.log(`예시 문장 버튼: ${[...new Set(결과.map((r) => r.문장))].slice(0, 3).map((s) => s.slice(0, 20) + '…').join(' / ')}`);
