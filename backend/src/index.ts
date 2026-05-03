import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { AIService } from './services/aiService'
import { Bank, Question } from './models'
import { VectorStore } from './infra/vectorStore'

dotenv.config()

const app = express()
app.use(bodyParser.json())

// In-memory stores (MVP)
const banks: Bank[] = []
const questions: Question[] = []
const vectorStore = new VectorStore()

// Endpoints
app.post('/banks/import', (req, res) => {
  const payload: Bank[] = req.body?.banks ?? []
  payload.forEach((b) => banks.push(b))
  res.json({ imported: payload.length, totalBanks: banks.length })
})

app.post('/solve', async (req, res) => {
  const { text, bankId, questionId, userId } = req.body
  let input = text ?? ''
  if (!input && questionId) {
    const q = questions.find((qq) => qq.id === questionId)
    if (q) input = q.text
  }
  if (!input) {
    return res.status(400).json({ error: 'No input provided' })
  }

  const ai = new AIService()
  const context = bankId ? `Bank: ${bankId}` : undefined
  const result = await ai.solve(input, context)
  // Persist a simple attempt if userId provided
  res.json({ input, answer: result.answer, steps: result.steps })
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
