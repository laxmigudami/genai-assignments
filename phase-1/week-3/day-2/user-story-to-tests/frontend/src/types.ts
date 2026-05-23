export interface GenerateRequest {
  storyTitle: string
  acceptanceCriteria: string
  description?: string
  additionalInfo?: string
}

export interface TestCase {
  id: string
  title: string
  steps: string[]
  testData?: string
  expectedResult: string
  category: string
}

export interface GenerateResponse {
  cases: TestCase[]
  model?: string
  promptTokens: number
  completionTokens: number
}

export interface FeatureFileResponse {
  content: string
  model?: string
  promptTokens: number
  completionTokens: number
}

// ── Jira Integration ──────────────────────────────────────────────────────────

export interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

export interface JiraStory {
  id: string
  key: string
  summary: string
  description: string
  status: string
  priority: string
  assignee: string
}
