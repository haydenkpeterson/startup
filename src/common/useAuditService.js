import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, fetchAuditHistory, submitAuditFile } from './apiClient';

const STATUS_IDLE = 'idle';
const STATUS_READY = 'ready';
const STATUS_PROCESSING = 'processing';
const STATUS_COMPLETE = 'complete';

export function useAuditService(userName) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(STATUS_IDLE);
  const [activeMessage, setActiveMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [history, setHistory] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  const isAuthenticated = Boolean(userName);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }

    try {
      const records = await fetchAuditHistory();
      setHistory(Array.isArray(records) ? records : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setHistory([]);
      } else {
        console.error('Failed to load audit history', err);
        setError('Could not load audit history. Please try again later.');
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0] ?? null;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      setSelectedFile(file);
      setAnalysisResult(null);
      setError('');
      setActiveMessage('');
      setProgressPercent(0);
      setShowPopup(false);
      setAnalysisStatus(file ? STATUS_READY : STATUS_IDLE);
    },
    []
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedFile || !isAuthenticated) {
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setAnalysisStatus(STATUS_PROCESSING);
      setShowPopup(true);
      setActiveMessage(`Uploading ${selectedFile.name} to AuditApp...`);
      setProgressPercent(25);
      setError('');

      try {
        const result = await submitAuditFile(selectedFile, controller.signal);
        setActiveMessage('Analyzing document with OpenAI...');
        setProgressPercent(70);

        setAnalysisResult(result);
        setActiveMessage('Audit complete. Review the findings below.');
        setProgressPercent(100);
        setAnalysisStatus(STATUS_COMPLETE);
        setShowPopup(true);

        setHistory((prev) => (Array.isArray(prev) ? [result, ...prev] : [result]));
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Audit cancelled.');
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          console.error('Audit submission failed', err);
          setError('Unable to process audit. Please try again.');
        }
        setAnalysisStatus(STATUS_IDLE);
        setActiveMessage('');
        setProgressPercent(0);
        setShowPopup(false);
      } finally {
        abortRef.current = null;
      }
    },
    [isAuthenticated, selectedFile]
  );

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setAnalysisStatus(selectedFile ? STATUS_READY : STATUS_IDLE);
    setActiveMessage('');
    setProgressPercent(0);
    setShowPopup(false);
    setError('');
  }, [selectedFile]);

  const handleFileTriggerClick = useCallback(() => {
    if (analysisStatus === STATUS_PROCESSING) {
      return;
    }
    fileInputRef.current?.click();
  }, [analysisStatus]);

  const enhancedHistory = useMemo(() => {
    return (history ?? []).map((entry) => ({
      ...entry,
      displayDate: entry?.createdAt
        ? new Date(entry.createdAt).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'Unknown',
      bulletPoints: entry?.summary
        ? entry.summary
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : [],
    }));
  }, [history]);

  return {
    selectedFile,
    analysisStatus,
    activeMessage,
    progressPercent,
    showPopup,
    filteredHistory: enhancedHistory,
    analysisResult,
    error,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleFileTriggerClick,
    fileInputRef,
    refreshHistory: loadHistory,
  };
}
