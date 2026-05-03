import OpenAI from 'openai'

export class AIService {
  private openai?: OpenAI

  constructor() {
    const key = process.env.OPENAI_API_KEY
    if (key) {
      this.openai = new OpenAI({ apiKey: key })
    }
  }

  async solve(input: string, context?: string): Promise<{ answer: string; steps: string[] }> {
    if (this.openai) {
      try {
        const prompt = `Solve the following problem and provide a step-by-step explanation:\n${input}\n${context ?? ''}`
        const response = await this.openai.completions.create({
          model: 'gpt-3.5-turbo-instruct',
          prompt,
          max_tokens: 500,
          temperature: 0.2,
        })
        const text = response.choices?.[0]?.text?.trim() ?? ''
        const steps = text.split('\n').filter((l) => l.trim().length > 0)
        return { answer: text, steps }
      } catch {
        // fallback to mock if API call fails
      }
    }
    // Mock response
    const mockSteps = [
      'Understand the problem',
      'Identify knowns and unknowns',
      'Apply a standard method',
      'Conclude with final answer',
    ]
    return { answer: `Mock answer for: ${input}`, steps: mockSteps }
  }
}

export default new AIService()
