import React from 'react'

type Props = { text: string; onUse?: () => void }

export default function QuestionCard({ text, onUse }: Props) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4, marginBottom: 8 }}>
      <div style={{ fontFamily: 'monospace' }}>{text}</div>
      {onUse && (
        <button onClick={onUse} style={{ marginTop: 6 }}>
          Kullan
        </button>
      )}
    </div>
  )
}
