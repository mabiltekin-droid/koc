import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import multer from 'multer'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// File upload setup
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') })
if (!fs.existsSync(path.join(__dirname, '..', 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true })
}

// JSON "database" files
const DB_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const QUESTIONS_FILE = path.join(DB_DIR, 'questions.json')
const ATTEMPTS_FILE = path.join(DB_DIR, 'attempts.json')
const GAP_PROFILES_FILE = path.join(DB_DIR, 'gap_profiles.json')

// Initialize files
if (!fs.existsSync(QUESTIONS_FILE)) fs.writeFileSync(QUESTIONS_FILE, '[]')
if (!fs.existsSync(ATTEMPTS_FILE)) fs.writeFileSync(ATTEMPTS_FILE, '[]')
if (!fs.existsSync(GAP_PROFILES_FILE)) fs.writeFileSync(GAP_PROFILES_FILE, '[]')

// Helpers
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

// Convert image to base64
const imageToBase64 = (filePath) => {
  const bitmap = fs.readFileSync(filePath)
  return `data:image/jpeg;base64,${bitmap.toString('base64')}`
}

// AI Solve endpoint (Text + Image)
app.post('/solve', upload.single('image'), async (req, res) => {
  const { text } = req.body
  const imageFile = req.file
  
  if (!text && !imageFile) {
    return res.status(400).json({ error: 'No input provided' })
  }

  const groqKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
  
  if (!groqKey) {
    return res.json({
      answer: `Mock çözüm: ${text || 'Görsel soru'}`,
      steps: ['1. Mock step 1', '2. Mock step 2']
    })
  }

  try {
    const messages = [
      {
        role: 'system',
        content: 'Sen bir soru çözüm asistanısın. Adım adım çözüm yap ve Türkçe açıkla.'
      }
    ]

    if (imageFile) {
      const base64Image = imageToBase64(imageFile.path)
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: text || 'Bu görseldeki soruyu çöz ve adım adım açıkla:' },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      })
      fs.unlinkSync(imageFile.path)
    } else {
      messages.push({
        role: 'user',
        content: `Bu soruyu çöz ve adım adım açıkla:\n${text}`
      })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content?.trim() ?? ''
    const steps = answer.split('\n').filter(l => l.trim())
    
    return res.json({ answer, steps })
  } catch (e) {
    console.error('Full error:', e)
    return res.status(500).json({ 
      error: 'AI API error', 
      message: e.message
    })
  }
})

// Extract question from image
app.post('/questions/extract-from-image', upload.single('image'), async (req, res) => {
  const imageFile = req.file
  
  if (!imageFile) {
    return res.status(400).json({ error: 'No image provided' })
  }

  const groqKey = process.env.GROQ_API_KEY
  
  if (!groqKey) {
    return res.json({
      text: 'Örnek soru metni (mock)',
      topic: 'Cebir',
      difficulty: 'medium'
    })
  }

  try {
    const base64Image = imageToBase64(imageFile.path)
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'Sen bir soru ayıklama asistanısın. Görselden soruyu, konusunu ve zorluk derecesini çıkar. JSON formatında döndür: {"text": "soru metni", "topic": "konu", "difficulty": "easy/medium/hard"}'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Bu görseldeki soruyu ayıkla:' },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    fs.unlinkSync(imageFile.path)

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    
    try {
      const extracted = JSON.parse(content)
      return res.json(extracted)
    } catch {
      return res.json({
        text: content,
        topic: 'Genel',
        difficulty: 'medium'
      })
    }
  } catch (e) {
    console.error('Extract error:', e)
    return res.status(500).json({ error: e.message })
  }
})

// Import questions from URL
app.post('/questions/import-from-url', async (req, res) => {
  const { url } = req.body
  
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' })
  }

  const groqKey = process.env.GROQ_API_KEY
  
  if (!groqKey) {
    return res.json({
      imported: 0,
      message: 'API key gerekli'
    })
  }

  try {
    // Fetch the webpage
    const pageResponse = await fetch(url)
    const html = await pageResponse.text()
    
    // Use AI to extract questions from HTML
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Sen bir soru ayıklama asistanısın. Verilen HTML içeriğinden soruları ayıkla. JSON array formatında döndür: [{"text": "soru", "topic": "konu", "difficulty": "easy/medium/hard"}]'
          },
          {
            role: 'user',
            content: `Bu HTML içeriğinden soruları ayıkla:\n${html.substring(0, 5000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const data = await groqResponse.json()
    const content = data.choices?.[0]?.message?.content?.trim() ?? '[]'
    
    let extractedQuestions = []
    try {
      extractedQuestions = JSON.parse(content)
    } catch {
      extractedQuestions = []
    }

    // Save to questions file
    const questions = readJSON(QUESTIONS_FILE)
    const newQuestions = extractedQuestions.map(q => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: q.text || 'Soru metni',
      topic: q.topic || 'Genel',
      difficulty: q.difficulty || 'medium',
      source: url,
      createdAt: new Date().toISOString()
    }))
    
    questions.push(...newQuestions)
    writeJSON(QUESTIONS_FILE, questions)
    
    return res.json({
      imported: newQuestions.length,
      questions: newQuestions
    })
  } catch (e) {
    console.error('URL import error:', e)
    return res.status(500).json({ error: e.message })
  }
})

// Questions endpoints
app.get('/questions', (req, res) => {
  const questions = readJSON(QUESTIONS_FILE)
  res.json(questions)
})

app.post('/questions', upload.single('image'), async (req, res) => {
  const questions = readJSON(QUESTIONS_FILE)
  
  let newQuestion
  
  // If image provided, extract question from image
  if (req.file) {
    try {
      const base64Image = imageToBase64(req.file.path)
      const groqKey = process.env.GROQ_API_KEY
      
      if (groqKey) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              {
                role: 'system',
                content: 'Görselden soruyu, konusunu ve zorluğunu çıkar. JSON formatında döndür: {"text": "soru", "topic": "konu", "difficulty": "easy/medium/hard"}'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Bu görseldeki soruyu ayıkla:' },
                  { type: 'image_url', image_url: { url: base64Image } }
                ]
              }
            ],
            temperature: 0.1
          })
        })
        
        fs.unlinkSync(req.file.path)
        
        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content?.trim() ?? ''
          try {
            newQuestion = JSON.parse(content)
          } catch {
            newQuestion = { text: content, topic: 'Genel', difficulty: 'medium' }
          }
        }
      }
    } catch (e) {
      console.error('Image extraction error:', e)
    }
  }
  
  if (!newQuestion) {
    newQuestion = {
      text: req.body.text,
      topic: req.body.topic,
      difficulty: req.body.difficulty
    }
  }
  
  newQuestion = {
    id: Date.now().toString(),
    ...newQuestion,
    createdAt: new Date().toISOString()
  }
  
  questions.push(newQuestion)
  writeJSON(QUESTIONS_FILE, questions)
  res.json(newQuestion)
})

// Attempts endpoints
app.post('/attempts', (req, res) => {
  const attempts = readJSON(ATTEMPTS_FILE)
  const newAttempt = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  }
  attempts.push(newAttempt)
  writeJSON(ATTEMPTS_FILE, attempts)
  
  // Update gap profile
  if (req.body.userId && req.body.topic) {
    const gaps = readJSON(GAP_PROFILES_FILE)
    const existingGap = gaps.find(g => g.userId === req.body.userId && g.topic === req.body.topic)
    
    if (existingGap) {
      existingGap.totalAttempts = (existingGap.totalAttempts || 0) + 1
      existingGap.correctAttempts = (existingGap.correctAttempts || 0) + (req.body.correct ? 1 : 0)
      existingGap.masteryScore = existingGap.correctAttempts / existingGap.totalAttempts
      existingGap.lastPracticed = new Date().toISOString()
    } else {
      gaps.push({
        id: Date.now().toString(),
        userId: req.body.userId,
        topic: req.body.topic,
        totalAttempts: 1,
        correctAttempts: req.body.correct ? 1 : 0,
        masteryScore: req.body.correct ? 1 : 0,
        lastPracticed: new Date().toISOString()
      })
    }
    writeJSON(GAP_PROFILES_FILE, gaps)
  }
  
  res.json(newAttempt)
})

// Gap Analysis endpoint
app.get('/gaps/:userId', (req, res) => {
  const gaps = readJSON(GAP_PROFILES_FILE)
  const userGaps = gaps.filter(g => g.userId === req.params.userId)
  userGaps.sort((a, b) => a.masteryScore - b.masteryScore)
  res.json(userGaps)
})

// Study Plan endpoint
app.get('/study-plan/:userId', (req, res) => {
  const gaps = readJSON(GAP_PROFILES_FILE)
  const userGaps = gaps.filter(g => g.userId === req.params.userId)
  
  const studyPlan = userGaps
    .filter(g => g.masteryScore < 0.7)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map(g => ({
      topic: g.topic,
      currentMastery: g.masteryScore,
      recommendedAction: g.masteryScore < 0.3 
        ? 'Konuyu tekrar çalış, temel videoları izle' 
        : g.masteryScore < 0.5
        ? 'Çok soru çöz, yaprak testleri yap'
        : 'Deneme soruları çöz, hızlan',
      priority: g.masteryScore < 0.3 ? 'Yüksek' : g.masteryScore < 0.5 ? 'Orta' : 'Düşük'
    }))
  
  res.json({
    studyPlan,
    summary: `${studyPlan.length} konuya odaklanmalısın`
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
  console.log(`✅ Groq API Key: ${process.env.GROQ_API_KEY ? 'LOADED' : 'NOT LOADED'}`)
  console.log(`✅ Using model: ${process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'}`)
})
