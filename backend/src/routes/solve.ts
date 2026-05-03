import express from 'express'
import aiService from '../services/aiService'
import db from '../db'

export function solveRouter() {
  const router = express.Router()

  router.post('/', async (req, res) => {
    const { text, userId, questionId } = req.body
    let input = text ?? ''
    let questionContext = ''

    if (!input && questionId) {
      const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as any
      if (question) {
        input = question.text
        questionContext = `Bank: ${question.bankId}`
      }
    }

    if (!input) {
      return res.status(400).json({ error: 'No input provided' })
    }

    const result = await aiService.solve(input, questionContext)

    if (userId && questionId) {
      db.prepare(
        'INSERT INTO attempts (id, userId, questionId, userAnswer, timestamp) VALUES (?, ?, ?, ?, ?)'
      ).run(
        crypto.randomUUID(),
        userId,
        questionId,
        text,
        new Date().toISOString()
      )
    }

    res.json({ input, answer: result.answer, steps: result.steps })
  })

  return router
}
