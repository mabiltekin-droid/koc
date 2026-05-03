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
      const res = await fetch('/solve', {
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
    <div style={{ padding: 20 }}>
      <h1>OpenCode Question AI</h1>
      <textarea
        rows={6}
        style={{ width: '100%', fontFamily: 'monospace' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a question or paste a bank item..."
      />
      <button onClick={handleSolve} disabled={loading} style={{ marginTop: 10 }}>
        {loading ? 'Çözümleniyor...' : 'Çözümü İste'}
      </button>
      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>Çözüm</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{response.answer}</pre>
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
