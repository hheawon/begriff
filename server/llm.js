// AI(LLM)를 부르는 유일한 파일.
// 다른 모델로 바꾸고 싶으면 이 파일만 고치면 된다. 나머지 코드는 generateJson()만 쓴다.
//
// 지금 쓰는 것: Google Gemini (공식 SDK @google/genai)
// API 키는 환경변수 GEMINI_API_KEY에서만 읽는다. (.env 파일 또는 Vercel 환경변수)
import { GoogleGenAI } from '@google/genai'

// 빠르고 저렴한 정식(Stable) 모델. 2026-11-22 Google 공식 문서 기준.
// 바꾸고 싶으면 코드를 고치지 않고 환경변수 GEMINI_MODEL로 덮어쓸 수 있다.
export const DEFAULT_MODEL ='gemini-3.5-flash-lite'

// 참고: temperature(무작위성) 설정에 대해
// 공식 문서에 따르면 gemini-3.5 계열은 temperature를 무시하고, 다음 세대부터는 넣으면 오류(400)가 난다.
// 그래서 temperature는 보내지 않고, 대신 ① 엄격한 시스템 지시문 ② 정해진 JSON 형식
// ③ 서버의 결과 검사(server/analyze.js)로 결과가 흔들리지 않게 한다.

export class LlmConfigError extends Error {}
export class LlmCallError extends Error {}

let client = null
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new LlmConfigError('GEMINI_API_KEY가 설정되지 않았습니다.')
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

/**
 * AI에게 지시문과 질문을 보내고, 정해진 JSON 형식(schema)으로 답을 받는다.
 * @param {{ system: string, prompt: string, schema: object }} args
 * @returns {Promise<object>} JSON으로 해석된 답
 */
export async function generateJson({ system, prompt, schema }) {
  const ai = getClient()
  let response
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        abortSignal: AbortSignal.timeout(25_000), // 25초 넘게 걸리면 포기
      },
    })
  } catch (err) {
    throw new LlmCallError(`AI 호출 실패: ${err?.message ?? err}`)
  }

  const text = response.text
  if (!text) throw new LlmCallError('AI가 빈 답을 보냈습니다.')
  try {
    return JSON.parse(text)
  } catch {
    throw new LlmCallError('AI 답이 JSON 형식이 아닙니다.')
  }
}
