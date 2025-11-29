import React, { useMemo, useState } from "react";

export function RealtimePopup({
  message,
  progress,
  isComplete,
  onClose,
  chatLog = [],
  connectionStatus = 'idle',
  onSendMessage,
}) {
  const [inputValue, setInputValue] = useState('');

  const connectionLabel = useMemo(() => {
    if (connectionStatus === 'open') return 'Connected';
    if (connectionStatus === 'connecting') return 'Connecting...';
    if (connectionStatus === 'error') return 'Connection error';
    if (connectionStatus === 'closed') return 'Disconnected';
    return 'Idle';
  }, [connectionStatus]);

  const canChat = isComplete && connectionStatus === 'open';

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim() || !canChat) return;
    const ok = onSendMessage ? onSendMessage(inputValue.trim()) : false;
    if (ok !== false) {
      setInputValue('');
    }
  };

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
            <div className="realtime-popup__chat-status">Chat: {connectionLabel}</div>
            <div className="realtime-popup__chat-log" aria-live="polite">
              {chatLog.length === 0 ? (
                <div className="realtime-popup__chat-empty">
                  {isComplete ? 'Ask a follow-up about your audit.' : 'Chat available after analysis completes.'}
                </div>
              ) : (
                chatLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`realtime-popup__chat-line realtime-popup__chat-line--${entry.author}`}
                  >
                    <strong>{entry.author === 'user' ? 'You' : entry.author === 'ai' ? 'AI' : 'System'}:</strong>{' '}
                    <span>
                      {entry.text || (entry.streaming ? '...' : '')}
                    </span>
                  </div>
                ))
              )}
            </div>
            <form className="realtime-popup__chat-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isComplete ? "Ask a question about your audit..." : "Available after analysis completes"}
                disabled={!canChat}
              />
              <button type="submit" disabled={!canChat || !inputValue.trim()}>
                Send
              </button>
            </form>
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
