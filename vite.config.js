import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 개발용: `npm run dev` 중에도 /api/analyze가 동작하게 연결한다.
// (배포된 사이트에서는 Vercel이 api/analyze.js를 직접 실행하므로 이 부분은 쓰이지 않는다)
function devApi() {
  return {
    name: 'begriff-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        try {
          const api = await import('./api/analyze.js')
          const handler = api[req.method]
          if (!handler) {
            res.statusCode = 405
            return res.end()
          }
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const request = new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: req.headers,
            body: req.method === 'GET' ? undefined : Buffer.concat(chunks),
          })
          const response = await handler(request)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(await response.text())
        } catch (err) {
          console.error('[dev api]', err)
          res.statusCode = 500
          res.end(JSON.stringify({ 오류: '개발 서버 오류' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // .env의 GEMINI_API_KEY를 서버 쪽(process.env)에만 넣는다.
  // VITE_로 시작하지 않는 값은 화면 코드에 절대 포함되지 않는다.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
  return {
    plugins: [react(), tailwindcss(), devApi()],
  }
})
