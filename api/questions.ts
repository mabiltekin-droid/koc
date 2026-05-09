import type { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory storage for serverless (resets on cold start)
let questions: any[] = []
let attempts: any[] = []
let gapProfiles: any[] = []

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req

  if (method === 'GET') {
    return res.json(questions)
  }

  if (method === 'POST') {
    const newQuestion = {
      id: Date.now().toString(),
      text: body.text,
      topic: body.topic || 'Genel',
      difficulty: body.difficulty || 'medium',
      createdAt: new Date().toISOString()
    }
    questions.push(newQuestion)
    return res.json(newQuestion)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}