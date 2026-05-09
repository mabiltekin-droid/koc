import React, { useState, useEffect } from 'react'
import './styles.css'

type SolveResponse = { answer: string; steps: string[] }
type Question = { id: string; text: string; topic?: string; difficulty?: string }
type Gap = { topic: string; masteryScore: number; totalAttempts: number; correctAttempts: number }
type StudyItem = { topic: string; currentMastery: number; recommendedAction: string; priority: string }

// Vercel'de API URL'si
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000'

function App() {
  const [input, setInput] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [response, setResponse] = useState<SolveResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const userId = 'user1'
  const [activeTab, setActiveTab] = useState('solve')
  const [questions, setQuestions] = useState<Question[]>([])
  const [gaps, setGaps] = useState<Gap[]>([])
  const [studyPlan, setStudyPlan] = useState<StudyItem[]>([])
  const [bankSubTab, setBankSubTab] = useState('text')
  const [newQuestion, setNewQuestion] = useState({ text: '', topic: '', difficulty: 'medium' })
  const [extracting, setExtracting] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/questions`)
      .then(res => res.json())
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
  }, [])

  const loadGaps = () => {
    fetch(`${API_URL}/attempts?userId=${userId}`)
      .then(res => res.json())
      .then(data => setGaps(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
  }

  async function handleSolve() {
    if (!input && !image) return
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResponse({ answer: data.answer, steps: data.steps ?? [] })
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      })
      const data = await res.json()
      setQuestions([...questions, data])
      setNewQuestion({ text: '', topic: '', difficulty: 'medium' })
      alert('Soru eklendi!')
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAttempt(questionId: string, correct: boolean, topic: string) {
    try {
      await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId, correct, topic })
      })
      alert('Kaydedildi!')
    } catch (err) {
      console.error(err)
    }
  }

  const totalQuestions = questions.length
  const totalAttempts = gaps.reduce((sum, g) => sum + (g.totalAttempts || 0), 0)
  const avgScore = gaps.length > 0 
    ? (gaps.reduce((sum, g) => sum + g.masteryScore, 0) / gaps.length * 100).toFixed(0)
    : 0

  return (
    <div className="container">
      <div className="header">
        <h1>📚 Question AI</h1>
        <p>Sorularını çöz, eksiklerini bul, geliş!</p>
      </div>

      <div className="main-card">
        <div className="nav-tabs">
          <button className={`nav-tab ${activeTab === 'solve' ? 'active' : ''}`} onClick={() => setActiveTab('solve')}>
            <span>🧠</span> Soru Çöz
          </button>
          <button className={`nav-tab ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
            <span>📖</span> Soru Bankası
          </button>
          <button className={`nav-tab ${activeTab === 'gaps' ? 'active' : ''}`} onClick={() => { setActiveTab('gaps'); loadGaps() }}>
            <span>📊</span> Analiz
          </button>
          <button className={`nav-tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>
            <span>🎯</span> Plan
          </button>
        </div>

        <div className="content">
          {activeTab === 'solve' && (
            <div>
              <textarea
                className="solve-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Sorunuzu yazın..."
                rows={5}
              />
              
              <button className="solve-btn" onClick={handleSolve} disabled={loading || !input}>
                {loading ? <><span className="loading-spinner"></span> Çözümleniyor...</> : '🚀 Çözümü İste'}
              </button>

              {error && <div className="error-box">⚠️ {error}</div>}

              {response && (
                <div className="solution-box">
                  <h3 style={{ marginBottom: 15 }}>✅ Çözüm</h3>
                  <div className="solution-text">{response.answer}</div>
                  <h4 style={{ marginTop: 20, marginBottom: 10 }}>📋 Adımlar</h4>
                  <ol>
                    {response.steps.map((s, i) => <li key={i} style={{ marginBottom: 5 }}>{s}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bank' && (
            <div>
              <div className="bank-tabs">
                <button className={`bank-tab ${bankSubTab === 'text' ? 'active' : ''}`} onClick={() => setBankSubTab('text')}>
                  ✏️ Metin
                </button>
              </div>

              {bankSubTab === 'text' && (
                <form onSubmit={handleAddQuestion}>
                  <div className="form-group">
                    <textarea
                      className="form-input"
                      placeholder="Soru metni..."
                      rows={4}
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <input
                      className="form-input"
                      placeholder="Konu (örn: Cebir)"
                      value={newQuestion.topic}
                      onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}
                      required
                    />
                    <select
                      className="form-select"
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                    >
                      <option value="easy">Kolay</option>
                      <option value="medium">Orta</option>
                      <option value="hard">Zor</option>
                    </select>
                  </div>
                  <button type="submit" className="submit-btn">➕ Soru Ekle</button>
                </form>
              )}

              <div className="questions-header">
                <h3>Mevcut Sorular ({questions.length})</h3>
              </div>

              {questions.length === 0 ? (
                <div className="empty-state">
                  <span>📝</span>
                  <p>Henüz soru eklenmemiş</p>
                </div>
              ) : questions.map(q => (
                <div key={q.id} className="question-card">
                  <div className="question-meta">
                    <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                    <span className="badge badge-topic">{q.topic}</span>
                  </div>
                  <p>{q.text}</p>
                  <div className="question-actions">
                    <button className="action-btn btn-correct" onClick={() => handleAttempt(q.id, true, q.topic || 'Genel')}>✅ Doğru</button>
                    <button className="action-btn btn-wrong" onClick={() => handleAttempt(q.id, false, q.topic || 'Genel')}>❌ Yanlış</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'gaps' && (
            <div>
              <div className="gap-summary">
                <div className="summary-card">
                  <h3>{totalQuestions}</h3>
                  <p>Toplam Soru</p>
                </div>
                <div className="summary-card">
                  <h3>{totalAttempts}</h3>
                  <p>Toplam Deneme</p>
                </div>
                <div className="summary-card">
                  <h3>{avgScore}%</h3>
                  <p>Ortalama Başarı</p>
                </div>
              </div>

              <h3 style={{ marginBottom: 20 }}>📊 Konu Bazlı Performans</h3>

              {gaps.length === 0 ? (
                <div className="empty-state">
                  <span>📈</span>
                  <p>Henüz yeterli veri yok. Soru çözmeye başla!</p>
                </div>
              ) : (
                <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h4 style={{ marginBottom: 15 }}>Başarı Grafiği</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
                    {gaps.slice(0, 5).map((g, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ 
                          height: `${Math.max((g.masteryScore * 100), 10)}%`, 
                          background: g.masteryScore < 0.3 ? '#ff6b6b' : g.masteryScore < 0.7 ? '#ffd93d' : '#6bcb77',
                          borderRadius: '8px 8px 0 0',
                          minHeight: 10
                        }} />
                        <div style={{ fontSize: '0.7rem', marginTop: 5 }}>{g.topic?.substring(0, 8)}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{(g.masteryScore * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && (
            <div>
              <h3 style={{ marginBottom: 20 }}>🎯 Kişisel Çalışma Planı</h3>
              <div className="empty-state">
                <span>📋</span>
                <p>Soru çözerek eksiklerinizi belirleyin.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App