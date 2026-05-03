import React, { useState } from 'react'

type SolveResponse = { answer: string; steps: string[] }

function App() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState<SolveResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSolve() {
    if (!input) return
    setLoading(true)
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })
      const data = await res.json()
      setResponse({ answer: data.answer, steps: data.steps ?? [] })
    } catch (e) {
      setResponse({ answer: 'Error', steps: [] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>OpenCode Question AI</h1>
      <p>Sorunuzu yazın, AI çözsün:</p>
      <textarea
        rows={6}
        style={{ width: '100%', fontFamily: 'monospace', padding: 10 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Örn: 2x + 5 = 13 ise x kaçtır?"
      />
      <button onClick={handleSolve} disabled={loading} style={{ marginTop: 10, padding: '10px 20px' }}>
        {loading ? 'Çözümleniyor...' : 'Çözümü İste'}
      </button>
      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>Çözüm</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 15, borderRadius: 5 }}>
            {response.answer}
          </pre>
          <h4>Adımlar</h4>
          <ol>
            {response.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export default App
