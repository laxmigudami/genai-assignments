import { GenerateRequest, GenerateResponse, FeatureFileResponse, JiraCredentials, JiraStory } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

export async function generateTests(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: GenerateResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error generating tests:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

export async function generateFeatureFile(request: GenerateRequest): Promise<FeatureFileResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-feature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json() as FeatureFileResponse
  } catch (error) {
    console.error('Error generating feature file:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

/** Authenticate with Jira and return Story-type issues */
export async function fetchJiraStories(credentials: JiraCredentials): Promise<JiraStory[]> {
  const response = await fetch(`${API_BASE_URL}/jira/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Jira connection failed (${response.status})`)
  return data.stories as JiraStory[]
}
