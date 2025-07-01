/**
 * React Application Entry Point
 * 
 * This file initializes the React application with providers and routing.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './globals.css'

// Remove the loading screen when the app is ready
postMessage({ payload: 'removeLoading' }, '*')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 