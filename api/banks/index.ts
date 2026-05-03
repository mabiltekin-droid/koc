import type { VercelRequest, VercelResponse } from '@vercel/node'

// Mock data - replace with real database in production
let banks = [
  { id: '1', name: 'Sample Question Bank', apiEndpoint: null, authType: null }
]

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.json(banks)
  }
  if (req.method === 'POST') {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const newBank = { 
      id: Date.now().toString(), 
      name, 
      apiEndpoint: req.body.apiEndpoint || null, 
      authType: req.body.authType || null 
    }
    banks.push(newBank)
    return res.json(newBank)
  }
  res.status(405).json({ error: 'Method not allowed' })
}
