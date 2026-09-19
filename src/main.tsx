import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { LearningHubApp } from '@/components/learning-hub/learning-hub-app';
import './globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Learning Hub root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <LearningHubApp />
  </StrictMode>,
);
