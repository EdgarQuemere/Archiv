import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Register from './components/auth/Register.jsx'
import Login from './components/auth/Login.jsx'
import Success from './components/auth/Success.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      {path === '/register' ? (
        <Register onLoginClick={() => { window.location.href = '/login' }} />
      ) : path === '/login' ? (
        <Login onRegisterClick={() => { window.location.href = '/register' }} />
      ) : path === '/success' ? (
        <Success />
      ) : (
        <App />
      )}
    </AuthProvider>
  </React.StrictMode>,
)
