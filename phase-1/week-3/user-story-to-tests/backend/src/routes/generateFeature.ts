import express from 'express'
import { GroqClient } from '../llm/groqClient'
import { GenerateRequestSchema, FeatureFileResponseSchema } from '../schemas'
import { FEATURE_SYSTEM_PROMPT, buildFeaturePrompt } from '../prompt'

export const generateFeatureRouter = express.Router()

generateFeatureRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const validationResult = GenerateRequestSchema.safeParse(req.body)

    if (!validationResult.success) {
      res.status(400).json({ error: `Validation error: ${validationResult.error.message}` })
      return
    }

    const request = validationResult.data
    const userPrompt = buildFeaturePrompt(request)
    const groqClient = new GroqClient()

    try {
      const groqResponse = await groqClient.generateTests(FEATURE_SYSTEM_PROMPT, userPrompt)

      const finalResponse = {
        content: groqResponse.content,
        model: groqResponse.model,
        promptTokens: groqResponse.promptTokens,
        completionTokens: groqResponse.completionTokens
      }

      const responseValidation = FeatureFileResponseSchema.safeParse(finalResponse)
      if (!responseValidation.success) {
        res.status(502).json({ error: 'Unexpected LLM response format' })
        return
      }

      res.json(responseValidation.data)
    } catch (llmError) {
      console.error('LLM error:', llmError)
      res.status(502).json({ error: 'Failed to generate feature file from LLM service' })
    }
  } catch (error) {
    console.error('Error in generate-feature route:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
