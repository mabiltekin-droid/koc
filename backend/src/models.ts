export interface User {
  id: string
  email: string
  hash: string
  role: string
}

export interface Bank {
  id: string
  name: string
  apiEndpoint?: string
  authType?: string
}

export interface Question {
  id: string
  bankId: string
  text: string
  answer?: string
  solutionSteps?: string[]
  tags?: string[]
  difficulty?: string
}

export interface Attempt {
  id: string
  userId: string
  questionId: string
  userAnswer?: string
  correct?: boolean
  timestamp?: string
  feedback?: string
}

export interface GapProfile {
  userId: string
  topic: string
  masteryScore: number
  lastPracticed?: string
}

export interface PracticeItem {
  id: string
  userId: string
  topic: string
  prompt: string
  expectedSolution: string
}
