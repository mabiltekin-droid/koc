import { Configuration, OpenAIApi } from 'openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const config = new Configuration({ 
  apiKey: process.env.GROQ_API_KEY,
  basePath: 'https://api.groq.com/openai/v1'
})
const openai = new OpenAIApi(config)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'No input provided' })
  }

  const groqKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

  if (!groqKey) {
    return res.json({
      answer: `Mock çözüm: ${text}`,
      steps: ['1. Problemi anla', '2. Çözümle', '3. Sonucu bul']
    })
  }

  try {
    const response = await openai.createChatCompletion({
      model: model,
      messages: [
        { role: 'system', content: 'Sen bir soru çözüm asistanısın. Adım adım çözüm yap ve Türkçe açıkla.' },
        { role: 'user', content: `Bu soruyu çöz ve adım adım açıkla:\n${text}` }
      ],
      temperature: 0.2,
      max_tokens: 1000
    })

    const answer = response.data.choices?.[0]?.message?.content?.trim() ?? ''
    const steps = answer.split('\n').filter(l => l.trim())

    return res.json({ answer, steps })
  } catch (e: any) {
    console.error('Groq API error:', e.message)
    return res.status(500).json({ error: 'AI API error', message: e.message })
  }
}