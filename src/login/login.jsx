import React, { useEffect, useMemo, useState } from 'react';
import './login.css';

const AUTH_STATES = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  UNKNOWN: 'unknown',
};

export function Login({ userName, authState = AUTH_STATES.UNKNOWN, onAuthChange }) {
  const [formUserName, setFormUserName] = useState(userName ?? '');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState(() => loadStoredHistory());

  useEffect(() => {
    setFormUserName(userName ?? '');
  }, [userName]);

  useEffect(() => {
    setHistory(loadStoredHistory());
  }, [authState]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'mockAnalysisHistory') {
        setHistory(loadStoredHistory());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleAuthenticate = (nextUserName) => {
    const trimmedName = nextUserName.trim();
    if (!trimmedName) {
      return;
    }
    onAuthChange?.(trimmedName, AUTH_STATES.AUTHENTICATED);
    setPassword('');
  };

  const handleLogout = () => {
    onAuthChange?.('', AUTH_STATES.UNAUTHENTICATED);
  };

  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;
  const filteredHistory = useMemo(() => {
    const key = userName || 'guest';
    return history.filter((entry) => entry.user === key);
  }, [history, userName]);

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
            <p>Thanks for creating an account. Your personalized dashboard will appear here once the backend is connected.</p>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </section>

          <section className="database-placeholder">
            <h2>Uploaded Files</h2>
            <div className="table-container table-container--scroll">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Filename</th>
                    <th>Score</th>
                    <th>Date Uploaded</th>
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleAuthenticate(formUserName);
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
            />

            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit" disabled={!formUserName || !password}>
              Login
            </button>
            <button
              type="button"
              className="create-account"
              onClick={() => handleAuthenticate(formUserName)}
              disabled={!formUserName || !password}
            >
              Create an Account
            </button>
          </form>
          <p><em>(Note: Authentication is mocked for now.)</em></p>
        </section>
      )}
    </main>
  );
}

function loadStoredHistory() {
  try {
    const stored = window.localStorage.getItem('mockAnalysisHistory');
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to parse stored mock history', error);
  }
  return [];
}
