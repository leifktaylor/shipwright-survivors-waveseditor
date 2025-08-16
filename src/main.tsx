// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Bundle global styles (don’t <link> them in HTML)
import './waveseditor.css';

const rootEl = document.getElementById('root') as HTMLElement;
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
