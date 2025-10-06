import React from 'react';
import './login.css';

export function Login() {
  return (
    <main>
      <section className="login-section">
        <h2>Sign In</h2>
        <form action="/login" method="post">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required />

          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />

          <button type="submit">Login</button>
          <button type="button" className="create-account">Create an Account</button>
        </form>
        <p><em>(Note: currently unavailable.)</em></p>
      </section>

      <section id="user-display">
        <h2>
          Welcome,{' '}
          <span id="display-username" className="username-placeholder">
            [username]
          </span>
          !
        </h2>
        <p>This section will display your username after login once the backend is connected.</p>
      </section>

      <section className="database-placeholder">
        <h2>Uploaded Files</h2>
        <div className="table-container">
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
              <tr>
                <td>jane_doe</td>
                <td>financials_q1.pdf</td>
                <td>87</td>
                <td>Feb 5, 2025</td>
              </tr>
              <tr>
                <td>john_smith</td>
                <td>transactions_jan.pdf</td>
                <td>72</td>
                <td>Feb 6, 2025</td>
              </tr>
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  More uploaded files and scores will appear here from the database...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
