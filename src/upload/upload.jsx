import React, { useCallback, useEffect, useRef, useState } from 'react';

const ANALYSIS_TEMPLATE = [
  { delay: 600, getMessage: (fileName) => `Uploading ${fileName}...` },
  { delay: 1500, getMessage: () => 'Running anomaly detection across all statements...' },
  { delay: 2400, getMessage: () => 'Interpreting trends and variance ratios...' },
  {
    delay: 3400,
    getMessage: (fileName, score) => `Analysis complete. AuditApp score: ${score}/100.`,
    finalize: true,
  },
];

export function Upload({ userName }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState('');
  const [analysisRunId, setAnalysisRunId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState(() => loadStoredHistory());
  const [showPopup, setShowPopup] = useState(false);
  const cancelRef = useRef(false);
  const timersRef = useRef([]);
  const analysisAbortRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    window.localStorage.setItem('mockAnalysisHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (analysisStatus !== 'processing' || !analysisRunId || !selectedFile) {
      return;
    }

    cancelRef.current = false;
    clearTimers();

    const score = generateAuditScore(selectedFile.name);
    const timers = ANALYSIS_TEMPLATE.map((step, index) =>
      setTimeout(() => {
        if (cancelRef.current) {
          return;
        }
        const text = step.getMessage(selectedFile.name, score);
        setMessages((prev) => [...prev, { id: `${analysisRunId}-${index}`, text }]);
        setActiveMessage(text);
        if (step.finalize) {
          setAnalysisStatus('complete');
          const entryDate = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const historyEntry = {
            user: userName || 'guest',
            filename: selectedFile.name,
            score,
            date: entryDate,
          };
          setLastResult({
            fileName: selectedFile.name,
            score,
            generatedAt: new Date(),
          });
          setHistory((prev) => [historyEntry, ...prev]);
          setShowPopup(true);
          analysisAbortRef.current = null;
        }
      }, step.delay)
    );
    timersRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
      if (timersRef.current === timers) {
        timersRef.current = [];
      }
      if (analysisAbortRef.current) {
        analysisAbortRef.current.abort();
        analysisAbortRef.current = null;
      }
    };
  }, [analysisStatus, analysisRunId, selectedFile, userName, clearTimers]);

  useEffect(() => {
    if (analysisStatus === 'idle') {
      setShowPopup(false);
    }
  }, [analysisStatus]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    cancelRef.current = true;
    clearTimers();
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
      analysisAbortRef.current = null;
    }
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
      analysisAbortRef.current = null;
    }
    setSelectedFile(file);
    setLastResult(null);
    setMessages([]);
    setActiveMessage('');
    setShowPopup(false);
    setAnalysisRunId(null);
    setAnalysisStatus(file ? 'ready' : 'idle');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }
    cancelRef.current = false;
    clearTimers();
    setLastResult(null);
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
    }
    analysisAbortRef.current = new AbortController();
    const runId = Date.now().toString();
    setAnalysisRunId(runId);
    const intro = `Preparing to analyze ${selectedFile.name}...`;
    setMessages([{ id: `${runId}-start`, text: intro }]);
    setActiveMessage(intro);
    setAnalysisStatus('processing');
    setShowPopup(true);
  };

  const handleCancel = () => {
    if (analysisStatus !== 'processing') {
      setShowPopup(false);
      return;
    }
    cancelRef.current = true;
    clearTimers();
    setMessages([]);
    setActiveMessage('');
    setShowPopup(false);
    setAnalysisRunId(null);
    setLastResult(null);
    setAnalysisStatus(selectedFile ? 'ready' : 'idle');
  };

  const disabled = analysisStatus === 'processing' || !selectedFile;

  const totalEvents = ANALYSIS_TEMPLATE.length + 1;
  const emittedEvents = messages.length;
  const progressPercent =
    totalEvents > 0 ? Math.min(100, Math.round((emittedEvents / totalEvents) * 100)) : 0;

  return (
    <main>
      <h2>Upload Your Financial Files</h2>
      <p>Submit your files for AI-powered auditing and analysis.</p>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label htmlFor="file"><strong>Select a file:</strong></label>
        <input
          type="file"
          id="file"
          name="file"
          required
          onChange={handleFileChange}
          disabled={analysisStatus === 'processing'}
        />
        <button type="submit" disabled={disabled}>
          {analysisStatus === 'processing' ? 'Analyzing...' : 'Process with AI'}
        </button>
      </form>

      <section>
        <h2>Recent Audit Scores</h2>
        <div className="table-container table-container--scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Filename</th>
                <th>Score</th>
                <th>Date Analyzed</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, index) => (
                <tr key={`${row.user}-${row.filename}-${index}`}>
                  <td>{row.user}</td>
                  <td>{row.filename}</td>
                  <td>{row.score}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    Upload a file to see your audit scores here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showPopup && (
        <RealtimePopup
          message={activeMessage}
          progress={progressPercent}
          isComplete={analysisStatus === 'complete'}
          onClose={handleCancel}
        />
      )}
    </main>
  );
}

function RealtimePopup({ message, progress, isComplete, onClose }) {
  return (
    <div className="realtime-popup" role="dialog" aria-modal="true">
      <div className="realtime-popup__content">
        <header className="realtime-popup__header">
          <h3>Realtime Analysis</h3>
          <button type="button" onClick={onClose} aria-label="Cancel analysis updates">
            Cancel
          </button>
        </header>
        <div className="realtime-popup__body">
          <div className="realtime-popup__progress">
            <div
              className="realtime-popup__progress-bar"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          <div className={`realtime-popup__message${isComplete ? ' realtime-popup__message--complete' : ''}`}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

function loadStoredHistory() {
  try {
    const stored = window.localStorage.getItem('mockAnalysisHistory');
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to parse stored mock history', error);
  }
  return [];
}

function generateAuditScore(fileName) {
  const base = 70;
  const variance = Math.min(25, Math.max(10, fileName.length));
  return base + Math.floor(Math.random() * variance);
}
