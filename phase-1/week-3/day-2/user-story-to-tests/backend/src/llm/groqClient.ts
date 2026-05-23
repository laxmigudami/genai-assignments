import fetch from 'node-fetch'

interface GroqResponse {
  content: string
  model?: string
  promptTokens: number
  completionTokens: number
}

export class GroqClient {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = process.env.groq_API_KEY || ''
    this.baseUrl = process.env.groq_API_BASE || 'https://api.groq.com/openai/v1'
    this.model = process.env.groq_MODEL || 'llama3-8b-8192'

    if (!this.apiKey) {
      console.warn('groq_API_KEY not found in environment variables')
    } else {
      console.log(`Groq API key configured. Model: ${this.model}`)
    }
  }

  async generateTests(systemPrompt: string, userPrompt: string): Promise<GroqResponse> {
    const endpoint = `${this.baseUrl}/chat/completions`

    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from Groq API')
    }

    // ✅ Remove JSON.parse — feature files are plain Gherkin text, not JSON
    return {
      content,                                    
      model: data.model,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0
    }
  }
}