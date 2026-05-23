import { Router, Request, Response } from 'express'
import axios from 'axios'

export const jiraRouter = Router()

interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

/** Recursively extract plain text from Atlassian Document Format (ADF) */
function extractPlainText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.content)) return node.content.map(extractPlainText).join(' ')
  return ''
}

/**
 * POST /api/jira/connect
 * Validates Jira credentials and returns Story-type issues via JQL.
 */
jiraRouter.post('/connect', async (req: Request, res: Response) => {
  const { baseUrl, email, apiToken } = req.body as JiraCredentials

  if (!baseUrl || !email || !apiToken) {
    return res.status(400).json({ error: 'baseUrl, email, and apiToken are required.' })
  }

  // Basic Auth: base64(email:token) — required by Jira Cloud REST API v3
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  const cleanBase = baseUrl.replace(/\/$/, '')

  try {
    const response = await axios.get(`${cleanBase}/rest/api/3/search`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
      params: {
        jql: 'issuetype = Story AND statusCategory != Done ORDER BY created DESC',
        fields: 'summary,description,status,assignee,priority',
        maxResults: 50,
      },
    })

    const stories = (response.data.issues as any[]).map((issue) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary as string,
      // description comes as ADF — convert to plain text
      description: extractPlainText(issue.fields.description),
      status: issue.fields.status?.name as string,
      priority: issue.fields.priority?.name as string,
      assignee: (issue.fields.assignee?.displayName as string) ?? 'Unassigned',
    }))

    return res.json({ stories })
  } catch (err: any) {
    const status: number | undefined = err.response?.status
    const message: string =
      err.response?.data?.errorMessages?.[0] ?? err.response?.data?.message ?? err.message

    if (status === 401) return res.status(401).json({ error: 'Invalid credentials.' })
    if (status === 403) return res.status(403).json({ error: 'Insufficient permissions to access Jira.' })
    return res.status(500).json({ error: `Jira API error: ${message}` })
  }
})
