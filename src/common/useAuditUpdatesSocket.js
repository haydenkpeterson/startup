import { useEffect, useRef, useState, useCallback } from 'react';

const STATUS_IDLE = 'idle';
const STATUS_CONNECTING = 'connecting';
const STATUS_OPEN = 'open';
const STATUS_CLOSED = 'closed';
const STATUS_ERROR = 'error';

export function useAuditUpdatesSocket({ enabled }) {
  const [status, setStatus] = useState(STATUS_IDLE);
  const [statusLog, setStatusLog] = useState([]);
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);
  const reconnectRef = useRef(null);
  const attemptRef = useRef(0);
  const lastTimeoutRef = useRef(0);

  const clearLog = useCallback(() => {
    setStatusLog([]);
  }, []);

  const cleanupSocket = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!socketRef.current) return;
    try {
      socketRef.current.close();
    } catch (err) {
      // Ignore close errors
    }
    socketRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanupSocket();
      setStatus(STATUS_IDLE);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WS_URL : null;
    const wsUrl = envUrl || `${protocol}://${window.location.host}/ws`;

    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      setStatus(STATUS_CONNECTING);

      timeoutRef.current = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          setStatus(STATUS_ERROR);
          const now = Date.now();
          if (!lastTimeoutRef.current || now - lastTimeoutRef.current > 1000) {
            lastTimeoutRef.current = now;
            setStatusLog((prev) => [
              ...prev,
              { id: `err-${now}`, text: `WebSocket connection timeout (${wsUrl})`, error: true },
            ]);
          }
          socket.close();
        }
      }, 5000);

      socket.onopen = () => {
        attemptRef.current = 0;
        setStatus(STATUS_OPEN);
        setStatusLog((prev) => [
          ...prev,
          { id: `status-${Date.now()}`, text: 'Connected to realtime updates.' },
        ]);
      };

      socket.onerror = () => {
        setStatus(STATUS_ERROR);
      };

      socket.onclose = (event) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setStatus(STATUS_CLOSED);
        if (event?.code === 1008) {
          setStatusLog((prev) => [
            ...prev,
            { id: `err-${Date.now()}`, text: 'WebSocket unauthorized', error: true },
          ]);
          return;
        }

        if (enabled) {
          const delay = Math.min(30000, 2000 * Math.max(1, attemptRef.current + 1));
          attemptRef.current += 1;
          reconnectRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'status') {
            setStatusLog((prev) => [
              ...prev,
              { id: `status-${Date.now()}`, text: message.text || '' },
            ]);
          } else if (message.type === 'error') {
            setStatusLog((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, text: message.msg || 'Status error', error: true },
            ]);
            setStatus(STATUS_ERROR);
          }
        } catch (err) {
          // Ignore malformed messages
        }
      };
    };

    connect();

    return () => {
      cleanupSocket();
      setStatus(STATUS_CLOSED);
    };
  }, [cleanupSocket, enabled]);

  return {
    statusLog,
    status,
    clearLog,
  };
}
