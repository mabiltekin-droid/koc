import OpenAI from 'openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No input provided' })

  const apiKey = process.env.OPENAI_API_KEY

  try {
    if (apiKey) {
      const openai = new OpenAI({ apiKey })
      const response = await openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt: `Solve the following problem and provide a step-by-step explanation:\n${text}`,
        max_tokens: 500,
        temperature: 0.2,
      })
      const result = response.choices?.[0]?.text?.trim() ?? ''
      const steps = result.split('\n').filter(l => l.trim())
      return res.json({ answer: result, steps })
    }
  } catch (e) {
    // Fall through to mock
  }

  // Mock fallback
  return res.json({
    answer: `Mock answer for: ${text}`,
    steps: ['Understand the problem', 'Identify knowns and unknowns', 'Apply a standard method', 'Conclude with final answer']
  })
}
