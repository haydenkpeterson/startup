import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appendHistoryEntry, loadHistory, saveHistory } from './mockHistory';

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

const FALLBACK_USER = 'guest';

export function useMockAnalysis(userName) {
  const effectiveUser = userName || FALLBACK_USER;

  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState('');
  const [analysisRunId, setAnalysisRunId] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [showPopup, setShowPopup] = useState(false);

  const cancelRef = useRef(false);
  const timersRef = useRef([]);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    saveHistory(history);
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
            user: effectiveUser,
            filename: selectedFile.name,
            score,
            date: entryDate,
          };

          setHistory((prev) => appendHistoryEntry(prev, historyEntry));
          setShowPopup(true);
          abortRef.current = null;
        }
      }, step.delay)
    );

    timersRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
      if (timersRef.current === timers) {
        timersRef.current = [];
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [analysisStatus, analysisRunId, selectedFile, clearTimers, effectiveUser]);

  useEffect(() => {
    if (analysisStatus === 'idle') {
      setShowPopup(false);
    }
  }, [analysisStatus]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    cancelRef.current = true;
    clearTimers();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSelectedFile(file);
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
    setShowPopup(true);
    setMessages([{ id: 'start', text: `Preparing to analyze ${selectedFile.name}...` }]);
    setActiveMessage(`Preparing to analyze ${selectedFile.name}...`);
    setAnalysisStatus('processing');
    const runId = Date.now().toString();
    setAnalysisRunId(runId);
    abortRef.current = new AbortController();
  };

  const handleCancel = () => {
    cancelRef.current = true;
    clearTimers();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setActiveMessage('');
    setShowPopup(false);
    setAnalysisRunId(null);
    setAnalysisStatus(selectedFile ? 'ready' : 'idle');
  };

  const handleFileTriggerClick = () => {
    if (analysisStatus === 'processing') {
      return;
    }
    fileInputRef.current?.click();
  };

  const progressPercent = useMemo(() => {
    const totalEvents = ANALYSIS_TEMPLATE.length + 1;
    return totalEvents > 0 ? Math.min(100, Math.round((messages.length / totalEvents) * 100)) : 0;
  }, [messages]);

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => entry.user === effectiveUser);
  }, [history, effectiveUser]);

  return {
    selectedFile,
    analysisStatus,
    activeMessage,
    progressPercent,
    showPopup,
    filteredHistory,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleFileTriggerClick,
    fileInputRef,
  };
}

function generateAuditScore(fileName) {
  const base = 70;
  const variance = Math.min(25, Math.max(10, fileName.length));
  return base + Math.floor(Math.random() * variance);
}
