import { JiraStory } from '../types'

interface Props {
  stories: JiraStory[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: (allSelected: boolean) => void
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Highest: { bg: '#fed7d7', color: '#c53030' },
  High:    { bg: '#fed7d7', color: '#c53030' },
  Medium:  { bg: '#fefcbf', color: '#975a16' },
  Low:     { bg: '#c6f6d5', color: '#276749' },
  Lowest:  { bg: '#e2e8f0', color: '#4a5568' },
}

export default function JiraStoryList({ stories, selectedIds, onToggle, onSelectAll }: Props) {
  const allSelected = stories.length > 0 && selectedIds.size === stories.length

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header row */}
      <div style={styles.listHeader}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>📋 Jira Stories ({stories.length})</h3>
        <label style={styles.selectAll}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onSelectAll(allSelected)}
          />
          {allSelected ? 'Deselect All' : 'Select All'}
        </label>
      </div>

      {/* Scrollable story list */}
      <ul style={styles.list}>
        {stories.map((story) => {
          const isSelected = selectedIds.has(story.id)
          const priorityStyle = PRIORITY_COLORS[story.priority] ?? PRIORITY_COLORS.Lowest

          return (
            <li
              key={story.id}
              style={{ ...styles.item, ...(isSelected ? styles.itemSelected : {}) }}
              onClick={() => onToggle(story.id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(story.id)}
                onClick={(e) => e.stopPropagation()} // prevent double-fire
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={styles.metaRow}>
                  <span style={styles.key}>{story.key}</span>
                  {story.priority && (
                    <span style={{ ...styles.badge, background: priorityStyle.bg, color: priorityStyle.color }}>
                      {story.priority}
                    </span>
                  )}
                  {story.status && (
                    <span style={{ ...styles.badge, background: '#e2e8f0', color: '#4a5568' }}>
                      {story.status}
                    </span>
                  )}
                  <span style={styles.assignee}>{story.assignee}</span>
                </div>
                <p style={styles.summary}>{story.summary}</p>
                {story.description && (
                  <p style={styles.desc}>
                    {story.description.slice(0, 130)}{story.description.length > 130 ? '…' : ''}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  listHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  selectAll: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' },
  item: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: 12, border: '1.5px solid #e2e8f0', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s', background: '#fff',
  },
  itemSelected: { borderColor: '#0052cc', background: '#ebf2ff' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  key: { fontWeight: 700, color: '#0052cc', fontSize: '0.85rem' },
  badge: { padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 },
  assignee: { fontSize: '0.78rem', color: '#888', marginLeft: 'auto' },
  summary: { margin: '0 0 2px', fontWeight: 500, color: '#2c3e50' },
  desc: { margin: 0, fontSize: '0.82rem', color: '#666' },
}
