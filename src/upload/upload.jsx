import React from 'react';
import { useMockAnalysis } from '../common/useMockAnalysis';
import { RealtimePopup } from './components/realtimePopup';

export function Upload({ userName }) {
  const {
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
  } = useMockAnalysis(userName);

  const disabled = analysisStatus === 'processing' || !selectedFile;

  return (
    <main>
      <h2>Upload Your Financial Files</h2>
      <p>Submit your files for AI-powered auditing and analysis.</p>

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
              {filteredHistory.map((row, index) => (
                <tr key={`${row.user}-${row.filename}-${index}`}>
                  <td>{row.user}</td>
                  <td>{row.filename}</td>
                  <td>{row.score}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    Upload a file to see your AuditApp scores here.
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
