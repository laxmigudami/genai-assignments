import { useState } from 'react'
import { JiraCredentials } from '../types'

interface Props {
  onClose: () => void
  onConnect: (credentials: JiraCredentials) => void
  isLoading: boolean
}

interface FieldErrors {
  baseUrl?: string
  email?: string
  apiToken?: string
}

export default function JiraConnectModal({ onClose, onConnect, isLoading }: Props) {
  const [form, setForm] = useState<JiraCredentials>({ baseUrl: '', email: '', apiToken: '' })
  const [errors, setErrors] = useState<FieldErrors>({})

  const update = (key: keyof JiraCredentials, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = (): FieldErrors => {
    const e: FieldErrors = {}
    if (!form.baseUrl.startsWith('https://'))
      e.baseUrl = 'Must start with https:// (e.g. https://yourorg.atlassian.net)'
    if (!form.email.includes('@')) e.email = 'Enter a valid email address'
    if (!form.apiToken.trim()) e.apiToken = 'API token is required'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }
    onConnect(form)
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <h2 style={styles.title}>🔗 Connect to Jira</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Jira Base URL"
            placeholder="https://yourorg.atlassian.net"
            value={form.baseUrl}
            error={errors.baseUrl}
            onChange={(v) => update('baseUrl', v)}
          />
          <Field
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            error={errors.email}
            onChange={(v) => update('email', v)}
          />
          <Field
            label="API Token"
            type="password"
            placeholder="Jira API token"
            value={form.apiToken}
            error={errors.apiToken}
            onChange={(v) => update('apiToken', v)}
            hint={
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
                style={styles.hint}
              >
                Generate API token ↗
              </a>
            }
          />

          <button type="submit" style={isLoading ? styles.btnDisabled : styles.btn} disabled={isLoading}>
            {isLoading ? 'Connecting…' : 'Connect & Fetch Stories'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Field sub-component ───────────────────────────────────────────────────────

interface FieldProps {
  label: string
  type?: string
  placeholder: string
  value: string
  error?: string
  onChange: (v: string) => void
  hint?: React.ReactNode
}

function Field({ label, type = 'text', placeholder, value, error, onChange, hint }: FieldProps) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
        autoComplete="off"
      />
      {hint && <span>{hint}</span>}
      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  )
}

// ── Inline styles (no extra CSS file needed) ──────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12,
    padding: '2rem', width: 'min(480px, 95vw)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.3rem', color: '#2c3e50' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1.2rem' },
  label: { fontWeight: 600, fontSize: '0.9rem', color: '#333' },
  input: {
    padding: '0.6rem 0.8rem', border: '1.5px solid #ddd', borderRadius: 6,
    fontSize: '0.95rem', outline: 'none',
  },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: '0.8rem' },
  hint: { color: '#0052cc', fontSize: '0.8rem' },
  btn: {
    width: '100%', padding: '0.75rem', background: '#0052cc', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
  },
  btnDisabled: {
    width: '100%', padding: '0.75rem', background: '#bdc3c7', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'not-allowed',
  },
}
