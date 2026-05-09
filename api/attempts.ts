import type { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory storage
let gapProfiles: any[] = []

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, body, query } = req
  const userId = query.userId as string

  if (method === 'POST') {
    const { userId, topic, correct } = body
    
    const existingGap = gapProfiles.find(g => g.userId === userId && g.topic === topic)
    
    if (existingGap) {
      existingGap.totalAttempts = (existingGap.totalAttempts || 0) + 1
      existingGap.correctAttempts = (existingGap.correctAttempts || 0) + (correct ? 1 : 0)
      existingGap.masteryScore = existingGap.correctAttempts / existingGap.totalAttempts
      existingGap.lastPracticed = new Date().toISOString()
    } else {
      gapProfiles.push({
        id: Date.now().toString(),
        userId,
        topic,
        totalAttempts: 1,
        correctAttempts: correct ? 1 : 0,
        masteryScore: correct ? 1 : 0,
        lastPracticed: new Date().toISOString()
      })
    }
    
    return res.json({ success: true })
  }

  if (method === 'GET' && userId) {
    const userGaps = gapProfiles.filter(g => g.userId === userId)
    userGaps.sort((a, b) => a.masteryScore - b.masteryScore)
    return res.json(userGaps)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}