import type { VercelRequest, VercelResponse } from '@vercel/node'

// Mock data for now - replace with real DB in production
const banks = [
  { id: '1', name: 'Sample Bank', apiEndpoint: null, authType: null }
]

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.json(banks)
  }
  if (req.method === 'POST') {
    const { name } = req.body
    const newBank = { id: Date.now().toString(), name, apiEndpoint: null, authType: null }
    banks.push(newBank)
    return res.json(newBank)
  }
  res.status(405).json({ error: 'Method not allowed' })
}
