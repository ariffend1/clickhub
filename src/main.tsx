import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { useStore } from "./store/useStore";

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Online Connection Listener to trigger Offline Sync Queue
window.addEventListener('online', () => {
  console.log('App is online. Processing offline sync queue...');
  useStore.getState().processSyncQueue()
    .then(() => useStore.getState().loadAllData())
    .catch(err => console.error('Failed to process offline sync queue:', err));
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
