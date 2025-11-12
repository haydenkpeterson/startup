import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiError, fetchAuditHistory } from '../common/apiClient';
import { renderMarkdown } from '../common/markdown';

const VIEW_MODES = {
  LIST: 'list',
  DETAIL: 'detail',
};

export function Dashboard() {
  const [audits, setAudits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const initialAuditParam = new URLSearchParams(location.search).get('audit');
  const [viewMode, setViewMode] = useState(initialAuditParam ? VIEW_MODES.DETAIL : VIEW_MODES.LIST);
  const [selectedAuditId, setSelectedAuditId] = useState(initialAuditParam);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const pdfAbortRef = useRef(null);
  const pdfUrlRef = useRef('');

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      setIsLoading(true);
      setError('');
      try {
        const records = await fetchAuditHistory();
        if (isActive) {
          setAudits(Array.isArray(records) ? records : []);
        }
      } catch (err) {
        if (!isActive) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          console.error('Failed to load audits', err);
          setError('Unable to load audit history right now.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadHistory().catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (audits.length === 0) {
      const auditParam = new URLSearchParams(location.search).get('audit');
      if (!auditParam) {
        setSelectedAuditId(null);
        setViewMode(VIEW_MODES.LIST);
        if (location.search) {
          navigate('/dashboard', { replace: true });
        }
      }
      return;
    }
  }, [audits, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auditParam = params.get('audit');
    if (auditParam && audits.some((audit) => audit.id === auditParam)) {
      setSelectedAuditId(auditParam);
      setViewMode(VIEW_MODES.DETAIL);
    } else if (!auditParam && viewMode === VIEW_MODES.DETAIL) {
      setViewMode(VIEW_MODES.LIST);
      setSelectedAuditId(null);
    }
  }, [location.search, viewMode, audits]);

  const cleanupPdfResources = useCallback(() => {
    if (pdfAbortRef.current) {
      pdfAbortRef.current.abort();
      pdfAbortRef.current = null;
    }
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = '';
    }
    setPdfUrl('');
    setPdfError('');
    setIsPdfLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupPdfResources();
    };
  }, [cleanupPdfResources]);

  const decoratedAudits = useMemo(() => {
    return (audits ?? [])
      .map((entry) => {
        const createdDate = entry?.createdAt ? new Date(entry.createdAt) : null;
        return {
          ...entry,
          timestamp: createdDate ? createdDate.getTime() : 0,
          displayDate: createdDate
            ? createdDate.toLocaleString(undefined, {
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
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [audits]);

  const selectedAudit = useMemo(() => {
    return decoratedAudits.find((audit) => audit.id === selectedAuditId) ?? null;
  }, [decoratedAudits, selectedAuditId]);

  useEffect(() => {
    if (viewMode !== VIEW_MODES.DETAIL || !selectedAudit) {
      cleanupPdfResources();
      return;
    }

    const controller = new AbortController();
    pdfAbortRef.current = controller;
    setIsPdfLoading(true);
    setPdfError('');

    fetch(`/api/audit/${selectedAudit.id}/file`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load PDF (status ${response.status})`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to load PDF', err);
        setPdfError('Unable to display this PDF right now.');
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = '';
        }
        setPdfUrl('');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsPdfLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedAudit, viewMode, cleanupPdfResources]);

  const handleSelectAudit = (auditId) => {
    setSelectedAuditId(auditId);
    setViewMode(VIEW_MODES.DETAIL);
    navigate(`/dashboard?audit=${auditId}`, { replace: true });
  };

  const handleBackToList = () => {
    setViewMode(VIEW_MODES.LIST);
    setSelectedAuditId(null);
    cleanupPdfResources();
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="dashboard-root">
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : viewMode === VIEW_MODES.LIST ? (
        <section className="dashboard-table">
          <h2 className="dashboard-title">Dashboard</h2>
          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {decoratedAudits.length > 0 ? (
                  decoratedAudits.map((audit) => (
                    <tr key={audit.id}>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => handleSelectAudit(audit.id)}
                        >
                          {audit.filename}
                        </button>
                      </td>
                      <td>{audit.displayDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                      No audits yet. Upload a PDF to see it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : selectedAudit ? (
        <section className="dashboard-detail dashboard-detail--full">
          <div className="detail-header">
            <h3 className="mb-0">{selectedAudit.filename}</h3>
          </div>
          <div className="detail-content detail-content--full">
            <div className="detail-preview">
              {isPdfLoading ? (
                <p>Loading PDF preview...</p>
              ) : pdfError ? (
                <p>{pdfError}</p>
              ) : pdfUrl ? (
                <object data={pdfUrl} type="application/pdf">
                  <p>Your browser cannot display PDFs inline.</p>
                </object>
              ) : (
                <p>No PDF available.</p>
              )}
            </div>
            <div className="detail-summary">
              {selectedAudit.bulletPoints.length > 0 ? (
                <div
                  className="markdown-summary"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedAudit.summary) }}
                />
              ) : (
                <p>No summary available.</p>
              )}
            </div>
          </div>
          <button type="button" className="back-button" onClick={handleBackToList}>
            Back
          </button>
        </section>
      ) : (
        <p>Select an audit to view it.</p>
      )}
    </main>
  );
}
