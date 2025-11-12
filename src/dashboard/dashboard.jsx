import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ApiError, fetchAuditHistory } from '../common/apiClient';

const VIEW_MODES = {
  LIST: 'list',
  DETAIL: 'detail',
};

export function Dashboard() {
  const [audits, setAudits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
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
      setSelectedAuditId(null);
      setViewMode(VIEW_MODES.LIST);
    }
  }, [audits]);

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
    return (audits ?? []).map((entry) => ({
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
  };

  const handleBackToList = () => {
    setViewMode(VIEW_MODES.LIST);
    setSelectedAuditId(null);
    cleanupPdfResources();
  };

  return (
    <main>
      <header className="mb-4">
        <h2>Audit Dashboard</h2>
        <p>Review every uploaded PDF and revisit its AI summary.</p>
      </header>

      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : viewMode === VIEW_MODES.LIST ? (
          <section className="table-container table-container--scroll dashboard-table">
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
          </section>
      ) : selectedAudit ? (
        <section className="dashboard-detail dashboard-detail--full">
          <div className="detail-header">
            <button type="button" className="back-button" onClick={handleBackToList}>
              ← Back to all audits
            </button>
            <div>
              <h3 className="mb-0">{selectedAudit.filename}</h3>
              <p className="text-muted">{selectedAudit.displayDate}</p>
            </div>
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
              <h4>Summary</h4>
              {selectedAudit.bulletPoints.length > 0 ? (
                <ul>
                  {selectedAudit.bulletPoints.map((line, index) => (
                    <li key={`${selectedAudit.id}-summary-${index}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>No summary available.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <p>Select an audit to view it.</p>
      )}
    </main>
  );
}
