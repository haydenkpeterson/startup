import React from 'react';
import { Link } from 'react-router-dom';
import { useAuditService } from '../common/useAuditService';
import { RealtimePopup } from './components/realtimePopup';
import { useAuditUpdatesSocket } from '../common/useAuditUpdatesSocket';

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

  const isAuthenticated = Boolean(userName);
  const { statusLog, status: chatStatus } = useAuditUpdatesSocket({
    enabled: isAuthenticated,
  });

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
        <div className="dashboard-cta">
          <Link to={`/dashboard?audit=${analysisResult.id}`} className="btn-dashboard-link">
            View audit
          </Link>
        </div>
      )}

      {showPopup && (
        <RealtimePopup
          message={activeMessage}
          progress={progressPercent}
          isComplete={analysisStatus === 'complete'}
          onClose={handleCancel}
          statusLog={statusLog}
          connectionStatus={chatStatus}
        />
      )}
    </main>
  );
}
