import React, { useMemo } from "react";

export function RealtimePopup({
  message,
  progress,
  isComplete,
  onClose,
  statusLog = [],
  connectionStatus = 'idle',
}) {
  const connectionLabel = useMemo(() => {
    if (connectionStatus === 'open') return 'Connected';
    if (connectionStatus === 'connecting') return 'Connecting...';
    if (connectionStatus === 'error') return 'Connection error';
    if (connectionStatus === 'closed') return 'Disconnected';
    return 'Idle';
  }, [connectionStatus]);

  return (
    <div className="realtime-popup" role="dialog" aria-modal="true">
      <div className="realtime-popup__content">
        <header className="realtime-popup__header">
          <h3>Realtime Audit</h3>
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

          <div className="realtime-popup__chat">
            <div className="realtime-popup__chat-status">Updates: {connectionLabel}</div>
            <div className="realtime-popup__chat-log" aria-live="polite">
              {statusLog.length === 0 ? (
                <div className="realtime-popup__chat-empty">
                  {isComplete ? 'Waiting for updates...' : 'Connecting to realtime updates...'}
                </div>
              ) : (
                statusLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`realtime-popup__chat-line${entry.error ? ' realtime-popup__chat-line--error' : ''}`}
                  >
                    <span>{entry.text || ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            className="realtime-popup__dismiss"
            onClick={onClose}
            aria-label="Close analysis updates"
          >
            {isComplete ? 'Exit' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
