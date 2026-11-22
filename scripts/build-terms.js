// 용어 DB 변환 스크립트
// 팀이 스프레드시트에서 저장한 CSV(data/terms.csv)를 앱이 읽는 JSON(data/terms.json)으로 바꾼다.
//
// 실행 (PowerShell):  npm run build:terms
// 다른 파일로 시험:   node scripts/build-terms.js 입력.csv 출력.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 프로젝트폴더 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const 입력경로 = path.resolve(process.argv[2] ?? path.join(프로젝트폴더, 'data', 'terms.csv'));
const 출력경로 = path.resolve(process.argv[3] ?? path.join(프로젝트폴더, 'data', 'terms.json'));

// 스프레드시트 열 순서. data/terms-template.csv의 머리글과 같아야 한다.
const 열목록 = ['원어', '번역어', '역본', '쪽수', '원문위치', '해설', '판단단서'];

function 멈추기(메시지) {
  console.error(`\n[오류] ${메시지}\n`);
  process.exit(1);
}

// CSV 글자를 줄(record) 목록으로 나눈다.
// 따옴표로 감싼 칸 안의 쉼표·줄바꿈, "" (따옴표 글자), CRLF/LF 줄끝을 처리한다.
// 각 줄에는 파일에서 시작한 줄 번호를 함께 기록해 오류 안내에 쓴다.
function CSV나누기(글) {
  const 결과 = [];
  let 칸 = '';
  let 줄 = [];
  let 따옴표안 = false;
  let 현재줄번호 = 1;
  let 시작줄번호 = 1;

  const 줄끝내기 = () => {
    줄.push(칸);
    const 빈줄 = 줄.every((값) => 값.trim() === '');
    if (!빈줄) 결과.push({ 줄번호: 시작줄번호, 칸들: 줄 });
    칸 = '';
    줄 = [];
  };

  for (let i = 0; i < 글.length; i++) {
    const 글자 = 글[i];

    if (따옴표안) {
      if (글자 === '"') {
        if (글[i + 1] === '"') {
          칸 += '"';
          i++;
        } else {
          따옴표안 = false;
        }
      } else if (글자 !== '\r') {
        if (글자 === '\n') 현재줄번호++;
        칸 += 글자;
      }
      continue;
    }

    if (글자 === '"') {
      따옴표안 = true;
    } else if (글자 === ',') {
      줄.push(칸);
      칸 = '';
    } else if (글자 === '\r') {
      // CRLF의 \r은 무시하고 \n에서 줄을 끝낸다.
    } else if (글자 === '\n') {
      줄끝내기();
      현재줄번호++;
      시작줄번호 = 현재줄번호;
    } else {
      칸 += 글자;
    }
  }

  if (따옴표안) 멈추기('따옴표(")가 열리고 닫히지 않은 칸이 있습니다. 해설 칸의 따옴표를 확인하세요.');
  if (칸 !== '' || 줄.length > 0) 줄끝내기();
  return 결과;
}

function 중복없이추가(목록, 값) {
  if (값 && !목록.includes(값)) 목록.push(값);
}

// 1. 파일 읽기 (UTF-8, 맨 앞 BOM 제거)
if (!fs.existsSync(입력경로)) 멈추기(`CSV 파일을 찾을 수 없습니다: ${입력경로}`);

let 글 = fs.readFileSync(입력경로, 'utf8');
if (글.charCodeAt(0) === 0xfeff) 글 = 글.slice(1);

if (글.includes('�')) {
  멈추기(
    '한글이 깨진 CSV입니다. UTF-8이 아닌 형식으로 저장된 것 같습니다.\n' +
      '  엑셀: 다른 이름으로 저장 → 파일 형식 "CSV UTF-8(쉼표로 분리)"로 다시 저장하세요.\n' +
      '  구글 시트: 파일 → 다운로드 → 쉼표로 구분된 값(.csv)으로 받으세요.',
  );
}

// 2. 머리글 확인
const 줄들 = CSV나누기(글);
if (줄들.length === 0) 멈추기('CSV 파일이 비어 있습니다.');

const 머리글 = 줄들[0].칸들.map((값) => 값.trim());
if (머리글.join(',') !== 열목록.join(',')) {
  멈추기(
    '첫 줄(머리글)이 양식과 다릅니다.\n' +
      `  필요한 머리글: ${열목록.join(',')}\n` +
      `  지금 머리글:   ${머리글.join(',')}\n` +
      '  data/terms-template.csv의 첫 줄을 그대로 쓰세요.',
  );
}

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
  묶음.번역어목록.push({ 번역어: 행.번역어, 역본: 행.역본, 쪽수: 행.쪽수 });
  번역어수++;
}

// 4. JSON 저장 (BOM 없는 UTF-8)
const 결과 = [...원어별.values()];
fs.writeFileSync(출력경로, JSON.stringify(결과, null, 2) + '\n', 'utf8');

console.log(`완료: 원어 ${결과.length}개, 번역어 ${번역어수}개 → ${path.relative(process.cwd(), 출력경로) || 출력경로}`);
