export interface Embedding {
  id: string
  content: string
  vector: number[]
}

export class VectorStore {
  private items: Embedding[] = []

  private mockEmbed(text: string): number[] {
    // Simple deterministic mock embedding: hash-based rough vector
    const seed = [...text].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)
    const vec: number[] = []
    let s = seed
    for (let i = 0; i < 128; i++) {
      s = (s * 1664525 + 1013904223) % 4294967296
      vec.push(((s % 1000) / 1000) * 2 - 1)
    }
    return vec
  }

  add(content: string): string {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const vector = this.mockEmbed(content)
    this.items.push({ id, content, vector })
    return id
  }

  search(query: string, topK: number = 3): Embedding[] {
    const qVec = this.mockEmbed(query)
    const score = (a: Embedding) => {
      // dot product
      let s = 0
      for (let i = 0; i < a.vector.length; i++) s += a.vector[i] * qVec[i]
      return s
    }
    return this.items
      .map((it) => ({ it, score: score(it) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((x) => x.it)
  }
}
