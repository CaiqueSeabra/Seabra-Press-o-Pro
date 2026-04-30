import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silent error logging for production stability
window.addEventListener('error', (event) => {
  console.error("Global Error Caught:", event.error?.message || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandled Promise Rejection:", event.reason?.message || event.reason);
});

createRoot(document.getElementById('root')!).render(
  <App />
);
