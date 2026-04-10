import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {ErrorBoundary} from './ErrorBoundary';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in document.');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
