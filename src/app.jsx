import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Home } from './home/home';
import { Upload } from './upload/upload';

const AUTH_STATES = {
    UNKNOWN: 'unknown',
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
};

export default function App() {
    const currentYear = new Date().getFullYear();
    const [authState, setAuthState] = useState(AUTH_STATES.UNKNOWN);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedUserName = window.localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);
            setAuthState(AUTH_STATES.AUTHENTICATED);
        } else {
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
        }
    }, []);

    const handleAuthChange = (nextUserName, nextAuthState) => {
        setUserName(nextUserName ?? '');
        setAuthState(nextAuthState);

        if (nextAuthState === AUTH_STATES.AUTHENTICATED && nextUserName) {
            window.localStorage.setItem('userName', nextUserName);
        } else {
            window.localStorage.removeItem('userName');
        }
    };

    const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;

    return (
        <BrowserRouter>
            <div className="body">
            <header>
                <img
                src="audit app logo maybe.png"
                alt="AuditApp Logo"
                className="logo"
                />
                <nav>
                <ul>
                    <li><NavLink className="nav-link" to="/">Home</NavLink></li>
                    {isAuthenticated && (
                        <li><NavLink className="nav-link" to="/upload">Upload</NavLink></li>
                    )}
                    <li>
                        <NavLink className="nav-link" to="/login">
                            {isAuthenticated ? 'Account' : 'Login'}
                        </NavLink>
                    </li>
                </ul>
                </nav>
            </header>

            <main>
                <Routes>
                    <Route path='/' element={<Home />} exact />
                    <Route
                        path='/upload'
                        element={isAuthenticated ? <Upload userName={userName} /> : <LoginRedirectNotice />}
                    />
                    <Route
                        path='/login'
                        element={
                            <Login
                                userName={userName}
                                authState={authState}
                                onAuthChange={handleAuthChange}
                            />
                        }
                    />
                    <Route path='*' element={<NotFound />} />
                </Routes>
            </main>

            <footer>
                <small>&copy; {currentYear} Hayden Peterson</small>
            </footer>
            </div>
        </BrowserRouter>
    );
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}

function LoginRedirectNotice() {
    return (
        <main className="container-fluid text-center">
            <h2>Please log in first</h2>
            <p>You need an account before uploading files. Visit the Login page to get started.</p>
        </main>
    );
}
