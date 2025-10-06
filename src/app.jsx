import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Home } from './home/home';
import { Upload } from './upload/upload';

export default function App() {
    const currentYear = new Date().getFullYear();
    return (
        <BrowserRouter>
            <div className="app-container">
            <header>
                <img
                src="audit app logo maybe.png"
                alt="AuditApp Logo"
                className="logo"
                />
                <nav>
                <ul>
                    <li><NavLink className="nav-link" to="/">Home</NavLink></li>
                    <li><NavLink className="nav-link" to="/upload">Upload</NavLink></li>
                    <li><NavLink className="nav-link" to="/login">Login</NavLink></li>
                </ul>
                </nav>
            </header>

            <Routes>
                <Route path='/' element={<Home />} exact />
                <Route path='/upload' element={<Upload />} />
                <Route path='/login' element={<Login />} />
                <Route path='*' element={<NotFound />} />
            </Routes>

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
