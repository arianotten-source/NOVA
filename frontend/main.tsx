import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MemoryProvider } from './context/MemoryContext';
import { AvatarProvider } from './context/AvatarContext';
import App from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MemoryProvider>
        <AvatarProvider>
          <App />
        </AvatarProvider>
      </MemoryProvider>
    </BrowserRouter>
  </StrictMode>
);
