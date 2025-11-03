import React from 'react';
import { useAuditService } from '../common/useAuditService';
import { RealtimePopup } from './components/realtimePopup';

export function Upload({ userName }) {
  const {
    selectedFile,
    analysisStatus,
    activeMessage,
    progressPercent,
    showPopup,
    filteredHistory,
    analysisResult,
    error,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleFileTriggerClick,
    fileInputRef,
  } = useAuditService(userName);

  const disabled = analysisStatus === 'processing' || !selectedFile;

  return (
    <main>
      <h2>Upload Your Financial Files</h2>
      <p>Submit your files for AI-powered auditing and analysis.</p>

      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="file-picker">
          <button
            type="button"
            className="file-picker__trigger"
            onClick={handleFileTriggerClick}
            disabled={analysisStatus === 'processing'}
          >
            Choose File
          </button>
          <span className="file-picker__name" aria-live="polite">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
          <input
            ref={fileInputRef}
            className="file-picker__input"
            type="file"
            id="file-input"
            name="file"
            required
            onChange={handleFileChange}
            disabled={analysisStatus === 'processing'}
            hidden
          />
        </div>
        <button type="submit" disabled={disabled}>
          {analysisStatus === 'processing' ? 'Analyzing...' : 'Process with AI'}
        </button>
      </form>

      {analysisResult && (
        <section className="mt-4">
          <h2>Latest Audit Findings</h2>
          <p>
            <strong>File:</strong> {analysisResult.filename}
          </p>
          <p>
            <strong>Generated:</strong> {new Date(analysisResult.createdAt).toLocaleString()}
          </p>
          <ul>
            {analysisResult.summary
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, index) => (
                <li key={`${analysisResult.id}-summary-${index}`}>{line}</li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Recent Audits</h2>
        <div className="table-container table-container--scroll">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Summary</th>
                <th>Date Analyzed</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row, index) => (
                <tr key={`${row.id}-${index}`}>
                  <td>{row.filename}</td>
                  <td>
                    <ul className="mb-0">
                      {row.bulletPoints.length > 0 ? (
                        row.bulletPoints.map((point, bulletIndex) => (
                          <li key={`${row.id}-point-${bulletIndex}`}>{point}</li>
                        ))
                      ) : (
                        <li>No summary available.</li>
                      )}
                    </ul>
                  </td>
                  <td>{row.displayDate}</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    Upload a file to see your AuditApp audits here.
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
