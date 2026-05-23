import { useState, useCallback } from 'react'
import { fetchJiraStories } from '../api'
import { JiraCredentials, JiraStory, GenerateRequest } from '../types'
import JiraConnectModal from './JiraConnectModal'
import JiraStoryList from './JiraStoryList'

interface Props {
  /** Called with GenerateRequest shaped stories so the parent can reuse its existing pipeline */
  onGenerateTests: (stories: GenerateRequest[]) => void
  isGenerating: boolean
}

export default function JiraConnect({ onGenerateTests, isGenerating }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [stories, setStories]       = useState<JiraStory[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError]           = useState<string | null>(null)
  const [connected, setConnected]   = useState(false)

  // ── Fetch stories from backend ─────────────────────────────────────────────
  const handleConnect = useCallback(async (credentials: JiraCredentials) => {
    setIsConnecting(true)
    setError(null)
    try {
      const fetched = await fetchJiraStories(credentials)
      setStories(fetched)
      setSelectedIds(new Set())
      setConnected(true)
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Jira')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleStory = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(
    (allSelected: boolean) => {
      setSelectedIds(allSelected ? new Set() : new Set(stories.map((s) => s.id)))
    },
    [stories]
  )

  // ── Trigger generation with selected stories ───────────────────────────────
  const handleGenerate = () => {
    const selected = stories.filter((s) => selectedIds.has(s.id))
    // Map Jira story fields → GenerateRequest shape used by the existing pipeline
    const requests: GenerateRequest[] = selected.map((s) => ({
      storyTitle: `[${s.key}] ${s.summary}`,
      acceptanceCriteria: s.description || s.summary,
      description: `Priority: ${s.priority} | Status: ${s.status} | Assignee: ${s.assignee}`,
    }))
    onGenerateTests(requests)
  }

  return (
    <div>
      {/* ── Connect button ─────────────────────────────────────────────────── */}
      <button
        style={connected ? styles.btnSecondary : styles.btnJira}
        onClick={() => setShowModal(true)}
      >
        {connected ? '🔄 Reconnect Jira' : '🔗 Connect to Jira'}
      </button>

      {/* ── Credential modal ───────────────────────────────────────────────── */}
      {showModal && (
        <JiraConnectModal
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
          isLoading={isConnecting}
        />
      )}

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div style={styles.errorBanner} role="alert">
          <span>⚠️ {error}</span>
          <button style={styles.dismissBtn} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── Story list + generate bar ──────────────────────────────────────── */}
      {stories.length > 0 && (
        <>
          <JiraStoryList
            stories={stories}
            selectedIds={selectedIds}
            onToggle={toggleStory}
            onSelectAll={handleSelectAll}
          />

          <div style={styles.generateBar}>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>
              {selectedIds.size} of {stories.length} selected
            </span>
            <button
              style={
                selectedIds.size === 0 || isGenerating
                  ? styles.btnGenerateDisabled
                  : styles.btnGenerate
              }
              onClick={handleGenerate}
              disabled={selectedIds.size === 0 || isGenerating}
            >
              {isGenerating
                ? '⚙️ Generating…'
                : `⚡ Generate Test Cases (${selectedIds.size})`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btnJira: {
    padding: '10px 20px', background: '#0052cc', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 20px', background: '#e2e8f0', color: '#333',
    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
  errorBanner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030',
    padding: '0.75rem 1rem', borderRadius: 8, marginTop: 12,
  },
  dismissBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#c53030', fontSize: '1rem' },
  generateBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, padding: 16, background: '#f7fafc', borderRadius: 8, border: '1px solid #e2e8f0',
  },
  btnGenerate: {
    padding: '10px 24px', background: '#0052cc', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
  },
  btnGenerateDisabled: {
    padding: '10px 24px', background: '#bdc3c7', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '1rem', cursor: 'not-allowed',
  },
}
