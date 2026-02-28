import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Importing Tailwind v4 configuration

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);