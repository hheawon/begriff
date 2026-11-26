// 사진 문장 인식: 책 페이지 사진에서 한국어 글자를 읽어 낸다. (선택 기능)
// 읽은 글자는 화면의 입력창에 들어가고, 학생이 확인·수정한 뒤 "분석하기"를 누른다.
// 저작권: 사진과 읽은 글자는 어디에도 저장하지 않고, 서버 기록(로그)에도 남기지 않는다.
import { generateJson } from './llm.js'
import { InputError } from './analyze.js'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 3 * 1024 * 1024 // 3MB (화면에서 미리 줄여 보내므로 보통 0.5MB 안팎)
const MAX_TEXT = 2000 // 읽은 글자는 이 길이에서 자른다 (분석은 어차피 500자까지)

const SYSTEM = `너는 책 사진에서 글자를 옮겨 적는 도우미다. 칸트 『순수이성비판』 한국어 번역서 페이지 사진이 주어진다.
[규칙]
1. 사진 속 한국어 본문을 보이는 그대로 옮겨 적는다. 고치거나, 번역하거나, 요약하거나, 설명을 덧붙이지 마라.
2. 쪽번호, 머리글(책·장 제목), 각주 번호, 여백의 메모는 뺀다.
3. 줄 끝에서 끊긴 단어는 이어 붙이고, 문단 안의 줄바꿈은 띄어쓰기 하나로 바꾼다. 문단이 바뀌는 곳만 줄을 바꾼다.
4. 원문에 함께 적힌 독일어·라틴어·한자는 그대로 둔다.
5. 흐리거나 가려져 확실히 읽을 수 없는 글자는 지어내지 말고 그 부분을 빼라.
6. 글자가 거의 없거나 읽을 수 없는 사진이면 빈 문자열을 돌려준다.`

const SCHEMA = {
  type: 'object',
  properties: { 텍스트: { type: 'string', description: '사진에서 읽은 본문 그대로' } },
  required: ['텍스트'],
}

// 입력 검사. 문제가 있으면 InputError(사용자에게 그대로 보여줄 한국어 메시지)
function validateImage(image, mimeType) {
  if (typeof image !== 'string' || !image) throw new InputError('사진이 비어 있습니다. 다시 골라 주세요.')
  if (!TYPES.includes(mimeType)) throw new InputError('JPG, PNG, WEBP 사진만 읽을 수 있습니다.')
  const bytes = Math.floor((image.length * 3) / 4) // base64 글자 수 → 실제 크기
  if (bytes > MAX_BYTES) throw new InputError('사진이 너무 큽니다. 3MB 이하로 줄여 주세요.')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new InputError('사진 형식이 잘못되었습니다. 다시 골라 주세요.')
}

export async function extractText(image, mimeType) {
  validateImage(image, mimeType)
  const ai = await generateJson({
    system: SYSTEM,
    prompt: '이 사진의 본문을 규칙대로 옮겨 적어 줘.',
    schema: SCHEMA,
    images: [{ mimeType, data: image }],
  })
  const 텍스트 = String(ai?.텍스트 ?? '').trim().slice(0, MAX_TEXT)
  return { 텍스트 }
}
