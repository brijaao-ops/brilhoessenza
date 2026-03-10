
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './contexts/ToastContext';
import { registerSW } from 'virtual:pwa-register';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Register the service worker for PWA
registerSW({
  onNeedRefresh() {
    console.log('Novas atualizações disponíveis para o Brilho Essenza.');
  },
  onOfflineReady() {
    console.log('Brilho Essenza pronto para uso offline.');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <PWAInstallPrompt />
    </ToastProvider>
  </React.StrictMode>
);
