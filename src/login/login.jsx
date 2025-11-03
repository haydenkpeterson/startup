import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, createAccount, fetchAuditHistory, login, logout } from '../common/apiClient';
import './login.css';

const AUTH_STATES = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  UNKNOWN: 'unknown',
};

export function Login({ userName, authState = AUTH_STATES.UNKNOWN, onAuthChange }) {
  const [formUserName, setFormUserName] = useState(userName ?? '');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormUserName(userName ?? '');
  }, [userName]);

  const loadAuditHistory = useCallback(async () => {
    try {
      const records = await fetchAuditHistory();
      setHistory(Array.isArray(records) ? records : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setHistory([]);
      } else {
        console.error('Failed to load audit history', err);
      }
    }
  }, []);

  useEffect(() => {
    if (authState === AUTH_STATES.AUTHENTICATED) {
      loadAuditHistory();
    } else {
      setHistory([]);
    }
  }, [authState, loadAuditHistory]);

  const handleAuthentication = async (action) => {
    const trimmedName = formUserName.trim();
    if (!trimmedName || !password) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const response =
        action === 'create'
          ? await createAccount(trimmedName, password)
          : await login(trimmedName, password);

      onAuthChange?.(response?.username ?? trimmedName, AUTH_STATES.AUTHENTICATED);
      setPassword('');
      setStatusMessage(
        action === 'create' ? 'Account created successfully.' : 'Login successful.'
      );
      await loadAuditHistory();
    } catch (err) {
      if (err instanceof ApiError) {
        setStatusMessage(err.message);
      } else {
        console.error('Authentication failed', err);
        setStatusMessage('Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setIsSubmitting(false);
      onAuthChange?.('', AUTH_STATES.UNAUTHENTICATED);
      setHistory([]);
      setPassword('');
    }
  };

  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;
  const filteredHistory = useMemo(() => {
    return (history ?? []).map((entry) => ({
      ...entry,
      displayDate: entry?.createdAt
        ? new Date(entry.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
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
  }, [history]);

  return (
    <main>
      {isAuthenticated ? (
        <>
          <section id="user-display">
            <h2>
              Welcome,{' '}
              <span id="display-username" className="username-placeholder">
                {userName}
              </span>
              !
            </h2>
            <p>You are connected to the live AuditApp service. Manage recent audits below.</p>
            <button type="button" onClick={handleLogout} disabled={isSubmitting}>
              Logout
            </button>
          </section>

          <section className="database-placeholder">
            <h2>Uploaded Files</h2>
            <div className="table-container table-container--scroll">
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Summary</th>
                    <th>Date Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      <td>{row.filename}</td>
                      <td>
                        <ul className="mb-0">
                          {row.bulletPoints.length > 0 ? (
                            row.bulletPoints.map((line, pointIndex) => (
                              <li key={`${row.id}-summary-${pointIndex}`}>{line}</li>
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
                        No uploads for this account yet. Try submitting a file from the Upload page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="login-section">
          <h2>Access AuditApp</h2>
          {statusMessage && (
            <div role="status" className="auth-feedback">
              {statusMessage}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAuthentication('login');
            }}
          >
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formUserName}
              onChange={(event) => setFormUserName(event.target.value)}
              disabled={isSubmitting}
            />

            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />

            <button type="submit" disabled={!formUserName || !password || isSubmitting}>
              {isSubmitting ? 'Working...' : 'Login'}
            </button>
            <button
              type="button"
              className="create-account"
              onClick={() => handleAuthentication('create')}
              disabled={!formUserName || !password || isSubmitting}
            >
              {isSubmitting ? 'Working...' : 'Create an Account'}
            </button>
          </form>
          <p><em>Password authentication is backed by the Node.js service.</em></p>
        </section>
      )}
    </main>
  );
}
