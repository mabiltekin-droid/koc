import express from 'express'
import db from '../db'

export function banksRouter() {
  const router = express.Router()

  router.post('/import', (req, res) => {
    try {
      const banksData = req.body?.banks ?? []
      const stmt = db.prepare('INSERT INTO banks (id, name, apiEndpoint, authType) VALUES (?, ?, ?, ?)')
      const insert = db.transaction((banks: any[]) => {
        for (const b of banks) {
          stmt.run(crypto.randomUUID(), b.name, b.apiEndpoint ?? null, b.authType ?? null)
        }
      })
      insert(banksData)
      res.json({ imported: banksData.length })
    } catch (error) {
      res.status(500).json({ error: 'Failed to import banks' })
    }
  })

  router.get('/', (req, res) => {
    const banks = db.prepare('SELECT * FROM banks').all()
    res.json(banks)
  })

  router.post('/:bankId/questions', (req, res) => {
    const { bankId } = req.params
    const questions = req.body?.questions ?? []
    try {
      const stmt = db.prepare(
        'INSERT INTO questions (id, bankId, text, answer, solutionSteps, tags, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      const insert = db.transaction((qs: any[]) => {
        for (const q of qs) {
          stmt.run(
            crypto.randomUUID(),
            bankId,
            q.text,
            q.answer ?? null,
            JSON.stringify(q.solutionSteps ?? []),
            JSON.stringify(q.tags ?? []),
            q.difficulty ?? null
          )
        }
      })
      insert(questions)
      res.json({ imported: questions.length })
    } catch (error) {
      res.status(500).json({ error: 'Failed to import questions' })
    }
  })

  return router
}
