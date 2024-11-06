import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import 'react-loading-skeleton/dist/skeleton.css';
import { App } from './components';

const container = document.getElementById('root');

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
