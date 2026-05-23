import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Keep service workers out of local Vite development to avoid stale module caches.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("Studier Service Worker registered successfully!", reg.scope))
      .catch((err) => console.warn("Studier Service Worker registration failed:", err));
  });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });

  caches?.keys?.().then((cacheNames) => {
    cacheNames
      .filter((cacheName) => cacheName.startsWith("studier-"))
      .forEach((cacheName) => {
        caches.delete(cacheName);
      });
  });
}
