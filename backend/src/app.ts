import express from 'express'
import cors from 'cors'
import { banksRouter } from './routes/banks'
import { solveRouter } from './routes/solve'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/banks', banksRouter())
app.use('/solve', solveRouter())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default app
