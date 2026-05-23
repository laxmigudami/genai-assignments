import { useState } from 'react'
import { generateTests, generateFeatureFile } from './api'
import { GenerateRequest, GenerateResponse, FeatureFileResponse, TestCase } from './types'
import JiraConnect from './components/JiraConnect'

function FeatureFilePanel({ featureResult }: { featureResult: FeatureFileResponse }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(featureResult.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([featureResult.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated.feature'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 15, borderBottom: '2px solid #e1e8ed' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#2c3e50', marginBottom: 6 }}>Generated Feature File</h2>
          <div style={{ color: '#666', fontSize: 14 }}>
            {featureResult.model && `Model: ${featureResult.model}`}
            {featureResult.promptTokens > 0 && ` • Tokens: ${featureResult.promptTokens + featureResult.completionTokens}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button className="copy-btn" style={{ background: '#3498db' }} onClick={handleDownload}>
            Download .feature
          </button>
        </div>
      </div>
      <pre className="feature-file-output">{featureResult.content}</pre>
    </div>
  )
}

function App() {
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: ''
  })
  const [results, setResults] = useState<GenerateResponse | null>(null)
  const [featureResult, setFeatureResult] = useState<FeatureFileResponse | null>(null)
  const [generateMode, setGenerateMode] = useState<'tests' | 'feature'>('tests')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId)
    } else {
      newExpanded.add(testCaseId)
    }
    setExpandedTestCases(newExpanded)
  }

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.storyTitle.trim() || !formData.acceptanceCriteria.trim()) {
      setError('Story Title and Acceptance Criteria are required')
      return
    }

    setIsLoading(true)
    setError(null)
    
    if (generateMode === 'feature') {
      try {
        const response = await generateFeatureFile(formData)
        setFeatureResult(response)
        setResults(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate feature file')
      } finally {
        setIsLoading(false)
      }
      return
    }
    
    try {
      const response = await generateTests(formData)
      setResults(response)
      setFeatureResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Called by JiraConnect with all selected Jira stories already formatted as GenerateRequest[].
   * Runs each story through the existing generation pipeline and merges test cases.
   */
  const handleGenerateFromJira = async (stories: GenerateRequest[]) => {
    if (!stories.length) return
    setIsLoading(true)
    setError(null)
    setResults(null)
    setFeatureResult(null)
    try {
      if (generateMode === 'feature') {
        // Merge all stories into a single feature file
        const parts: string[] = []
        let lastMeta = { model: '', promptTokens: 0, completionTokens: 0 }
        for (const story of stories) {
          const response = await generateFeatureFile(story)
          parts.push(response.content)
          lastMeta = {
            model: response.model ?? '',
            promptTokens: lastMeta.promptTokens + response.promptTokens,
            completionTokens: lastMeta.completionTokens + response.completionTokens,
          }
        }
        setFeatureResult({ content: parts.join('\n\n'), ...lastMeta })
      } else {
        const allCases: TestCase[] = []
        let lastMeta = { model: '', promptTokens: 0, completionTokens: 0 }
        for (const story of stories) {
          const response = await generateTests(story)
          allCases.push(...response.cases)
          lastMeta = {
            model: response.model ?? '',
            promptTokens: lastMeta.promptTokens + response.promptTokens,
            completionTokens: lastMeta.completionTokens + response.completionTokens,
          }
        }
        setResults({ cases: allCases, ...lastMeta })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 95%;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 90%;
            padding: 30px;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            max-width: 85%;
            padding: 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .container {
            max-width: 1800px;
            padding: 50px;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .error-banner {
          background: #e74c3c;
          color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e8ed;
        }
        
        .results-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-meta {
          color: #666;
          font-size: 14px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }
        
        .results-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .results-table tr:hover {
          background: #f8f9fa;
        }
        
        .category-positive { color: #27ae60; font-weight: 600; }
        .category-negative { color: #e74c3c; font-weight: 600; }
        .category-edge { color: #f39c12; font-weight: 600; }
        .category-authorization { color: #9b59b6; font-weight: 600; }
        .category-non-functional { color: #34495e; font-weight: 600; }
        
        .test-case-id {
          cursor: pointer;
          color: #3498db;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .test-case-id:hover {
          background: #f8f9fa;
        }
        
        .test-case-id.expanded {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(90deg);
        }
        
        .expanded-details {
          margin-top: 15px;
          background: #fafbfc;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
        }
        
        .step-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .step-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .step-id {
          font-weight: 600;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .step-description {
          color: #2c3e50;
          line-height: 1.5;
        }
        
        .step-test-data {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        .step-expected {
          color: #27ae60;
          font-weight: 500;
          font-size: 14px;
        }
        
        .step-labels {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mode-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #3498db;
          width: fit-content;
        }

        .mode-tab {
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: white;
          color: #3498db;
          transition: background 0.15s, color 0.15s;
        }

        .mode-tab.active {
          background: #3498db;
          color: white;
        }

        .mode-tab:hover:not(.active) {
          background: #eaf4fc;
        }

        .feature-file-output {
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.7;
          padding: 24px;
          border-radius: 6px;
          white-space: pre;
          overflow-x: auto;
        }

        .copy-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .copy-btn:hover { background: #219a52; }
        .copy-btn.copied { background: #2ecc71; }
      `}</style>
      
      <div className="container">
        <div className="header">
          <h1 className="title">User Story to Tests</h1>
          <p className="subtitle">Generate comprehensive test cases from your user stories</p>
        </div>

        {/* ── Mode Tabs ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div className="mode-tabs">
            <button
              type="button"
              className={`mode-tab${generateMode === 'tests' ? ' active' : ''}`}
              onClick={() => setGenerateMode('tests')}
            >
              Test Cases
            </button>
            <button
              type="button"
              className={`mode-tab${generateMode === 'feature' ? ' active' : ''}`}
              onClick={() => setGenerateMode('feature')}
            >
              Feature File
            </button>
          </div>
          <p style={{ color: '#888', fontSize: '0.82rem', marginTop: 6 }}>
            {generateMode === 'tests'
              ? 'Generate structured test cases (table view)'
              : 'Generate a Gherkin .feature file (BDD format)'}
          </p>
        </div>

        {/* ── Jira Integration ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <JiraConnect onGenerateTests={handleGenerateFromJira} isGenerating={isLoading} />
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <hr style={{ flex: 1, borderColor: '#e1e8ed' }} />
          <span style={{ color: '#999', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>or enter manually</span>
          <hr style={{ flex: 1, borderColor: '#e1e8ed' }} />
        </div>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="storyTitle" className="form-label">
              Story Title *
            </label>
            <input
              type="text"
              id="storyTitle"
              className="form-input"
              value={formData.storyTitle}
              onChange={(e) => handleInputChange('storyTitle', e.target.value)}
              placeholder="Enter the user story title..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional description (optional)..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="acceptanceCriteria" className="form-label">
              Acceptance Criteria *
            </label>
            <textarea
              id="acceptanceCriteria"
              className="form-textarea"
              value={formData.acceptanceCriteria}
              onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
              placeholder="Enter the acceptance criteria..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="additionalInfo" className="form-label">
              Additional Info
            </label>
            <textarea
              id="additionalInfo"
              className="form-textarea"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional information (optional)..."
            />
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading
              ? 'Generating...'
              : generateMode === 'feature'
              ? 'Generate Feature File'
              : 'Generate Test Cases'}
          </button>
        </form>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            {generateMode === 'feature' ? 'Generating feature file...' : 'Generating test cases...'}
          </div>
        )}

        {featureResult && (
          <FeatureFilePanel featureResult={featureResult} />
        )}

        {results && (
          <div className="results-container">
            <div className="results-header">
              <h2 className="results-title">Generated Test Cases</h2>
              <div className="results-meta">
                {results.cases.length} test case(s) generated
                {results.model && ` • Model: ${results.model}`}
                {results.promptTokens > 0 && ` • Tokens: ${results.promptTokens + results.completionTokens}`}
              </div>
            </div>
            
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Test Case ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Expected Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.cases.map((testCase: TestCase) => (
                    <>
                      <tr key={testCase.id}>
                        <td>
                          <div 
                            className={`test-case-id ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}
                            onClick={() => toggleTestCaseExpansion(testCase.id)}
                          >
                            <span className={`expand-icon ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {testCase.id}
                          </div>
                        </td>
                        <td>{testCase.title}</td>
                        <td>
                          <span className={`category-${testCase.category.toLowerCase()}`}>
                            {testCase.category}
                          </span>
                        </td>
                        <td>{testCase.expectedResult}</td>
                      </tr>
                      {expandedTestCases.has(testCase.id) && (
                        <tr key={`${testCase.id}-details`}>
                          <td colSpan={4}>
                            <div className="expanded-details">
                              <h4 style={{marginBottom: '15px', color: '#2c3e50'}}>Test Steps for {testCase.id}</h4>
                              <div className="step-labels">
                                <div>Step ID</div>
                                <div>Step Description</div>
                                <div>Test Data</div>
                                <div>Expected Result</div>
                              </div>
                              {testCase.steps.map((step, index) => (
                                <div key={index} className="step-item">
                                  <div className="step-header">
                                    <div className="step-id">S{String(index + 1).padStart(2, '0')}</div>
                                    <div className="step-description">{step}</div>
                                    <div className="step-test-data">{testCase.testData || 'N/A'}</div>
                                    <div className="step-expected">
                                      {index === testCase.steps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App