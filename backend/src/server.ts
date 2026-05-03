import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// JSON "database" files
const DB_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const QUESTIONS_FILE = path.join(DB_DIR, 'questions.json')
if (!fs.existsSync(QUESTIONS_FILE)) fs.writeFileSync(QUESTIONS_FILE, '[]')

// Helpers
const readJSON = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'))
const writeJSON = (file: string, data: any) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

// AI Solve endpoint
app.post('/solve', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No input provided' })

  // Check for API keys (Groq or OpenAI)
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (groqKey || openaiKey) {
    try {
      const OpenAI = (await import('openai')).default
      
      // Groq kullanıyorsan base URL'yi değiştir
      const options: any = {}
      if (groqKey) {
        options.apiKey = groqKey
        options.baseURL = 'https://api.groq.com/openai/v1'
      } else {
        options.apiKey = openaiKey
      }
      
      const openai = new OpenAI(options)
      
      const response = await openai.chat.completions.create({
        model: groqKey ? 'llama3-8b-8192' : 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Sen bir soru çözüm asistanısın. Adım adım çözüm yap.' },
          { role: 'user', content: `Bu soruyu çöz ve adım adım açıkla:\n${text}` }
        ],
        max_tokens: 500,
        temperature: 0.2,
      })
      
      const answer = response.choices?.[0]?.message?.content?.trim() ?? ''
      const steps = answer.split('\n').filter((l: string) => l.trim())
      
      return res.json({ answer, steps })
    } catch (e: any) {
      console.error('AI error:', e.message)
    }
  }

  // Mock response
  res.json({
    answer: `Çözüm: ${text} sorusunun cevabı mock olarak hesaplandı.`,
    steps: [
      '1. Problemi anla',
      '2. Bilinenleri ve bilinmeyenleri belirle',
      '3. Uygun yöntemi uygula',
      '4. Sonucu kontrol et'
    ]
  })
})

// Questions endpoints
app.get('/questions', (req, res) => {
  const questions = readJSON(QUESTIONS_FILE)
  res.json(questions)
})

app.post('/questions', (req, res) => {
  const questions = readJSON(QUESTIONS_FILE)
  const newQuestion = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  }
  questions.push(newQuestion)
  writeJSON(QUESTIONS_FILE, questions)
  res.json(newQuestion)
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})
