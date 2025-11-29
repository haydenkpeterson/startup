import { useEffect, useRef, useState, useCallback } from 'react';

const STATUS_IDLE = 'idle';
const STATUS_CONNECTING = 'connecting';
const STATUS_OPEN = 'open';
const STATUS_CLOSED = 'closed';
const STATUS_ERROR = 'error';

export function useChatSocket({ enabled }) {
  const [status, setStatus] = useState(STATUS_IDLE);
  const [chatLog, setChatLog] = useState([]);
  const socketRef = useRef(null);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (err) {
        // Ignore close errors
      }
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanupSocket();
      setStatus(STATUS_IDLE);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    setStatus(STATUS_CONNECTING);

    socket.onopen = () => {
      setStatus(STATUS_OPEN);
    };

    socket.onerror = () => {
      setStatus(STATUS_ERROR);
    };

    socket.onclose = () => {
      setStatus((prev) => (prev === STATUS_OPEN ? STATUS_CLOSED : prev));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ai_token') {
          const aiId = `ai-${message.id}`;
          setChatLog((prev) => {
            const existing = prev.find((m) => m.id === aiId);
            if (existing) {
              return prev.map((m) =>
                m.id === aiId ? { ...m, text: (m.text || '') + (message.text || ''), streaming: true } : m
              );
            }
            return [...prev, { id: aiId, author: 'ai', text: message.text || '', streaming: true }];
          });
        } else if (message.type === 'ai_complete') {
          const aiId = `ai-${message.id}`;
          setChatLog((prev) => {
            const existing = prev.find((m) => m.id === aiId);
            if (existing) {
              return prev.map((m) =>
                m.id === aiId
                  ? { ...m, text: message.text || existing.text || '', streaming: false }
                  : m
              );
            }
            return [...prev, { id: aiId, author: 'ai', text: message.text || '', streaming: false }];
          });
        } else if (message.type === 'error') {
          setChatLog((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, author: 'system', text: message.msg || 'Chat error', error: true },
          ]);
          setStatus(STATUS_ERROR);
        }
      } catch (err) {
        // Ignore malformed messages
      }
    };

    return () => {
      cleanupSocket();
      setStatus(STATUS_CLOSED);
    };
  }, [cleanupSocket, enabled]);

  const sendMessage = useCallback(
    (text) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !text?.trim()) {
        return false;
      }

      const id = `msg-${Date.now()}`;
      const payload = { type: 'user_message', id, text };

      setChatLog((prev) => [
        ...prev,
        { id, author: 'user', text },
        { id: `ai-${id}`, author: 'ai', text: '', streaming: true },
      ]);

      socket.send(JSON.stringify(payload));
      return true;
    },
    []
  );

  const resetChat = useCallback(() => {
    setChatLog([]);
  }, []);

  return {
    chatLog,
    status,
    sendMessage,
    resetChat,
  };
}
