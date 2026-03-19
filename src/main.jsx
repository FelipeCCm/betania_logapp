import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { TimerProvider } from './contexts/TimerContext.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TimerProvider>
      <App />
    </TimerProvider>
  </React.StrictMode>,
)
