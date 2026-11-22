import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { setupDiagnostics } from './core/debug/diagnostics';
import './style.css';

// Initialize console diagnostics __PROMETHEUS_DEBUG__
setupDiagnostics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

