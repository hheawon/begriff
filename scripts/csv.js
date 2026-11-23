// CSV 읽기 공용 함수. 용어 DB(build-terms.js)와 테스트 문장(build-test-sentences.js) 변환이 함께 쓴다.
import fs from 'node:fs';

export function 멈추기(메시지) {
  console.error(`\n[오류] ${메시지}\n`);
  process.exit(1);
}

// CSV 파일을 읽는다 (UTF-8, 맨 앞 BOM 제거, 한글 깨짐 검사)
export function CSV읽기(입력경로) {
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
  return 글;
}

// 첫 줄(머리글)이 양식과 같은지 확인한다
export function 머리글확인(줄들, 열목록, 양식파일) {
  if (줄들.length === 0) 멈추기('CSV 파일이 비어 있습니다.');
  const 머리글 = 줄들[0].칸들.map((값) => 값.trim());
  if (머리글.join(',') !== 열목록.join(',')) {
    멈추기(
      '첫 줄(머리글)이 양식과 다릅니다.\n' +
        `  필요한 머리글: ${열목록.join(',')}\n` +
        `  지금 머리글:   ${머리글.join(',')}\n` +
        `  ${양식파일}의 첫 줄을 그대로 쓰세요.`,
    );
  }
}

// CSV 글자를 줄(record) 목록으로 나눈다.
// 따옴표로 감싼 칸 안의 쉼표·줄바꿈, "" (따옴표 글자), CRLF/LF 줄끝을 처리한다.
// 각 줄에는 파일에서 시작한 줄 번호를 함께 기록해 오류 안내에 쓴다.
export function CSV나누기(글) {
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

  if (따옴표안) 멈추기('따옴표(")가 열리고 닫히지 않은 칸이 있습니다. 칸 안의 따옴표를 확인하세요.');
  if (칸 !== '' || 줄.length > 0) 줄끝내기();
  return 결과;
}
