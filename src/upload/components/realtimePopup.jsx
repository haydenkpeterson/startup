import React from "react";

export function RealtimePopup({ message, progress, isComplete, onClose }) {
  return (
    <div className="realtime-popup" role="dialog" aria-modal="true">
      <div className="realtime-popup__content">
        <header className="realtime-popup__header">
          <h3>Realtime Analysis</h3>
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
