import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MemoryProvider } from './context/MemoryContext';
import { AvatarProvider } from './context/AvatarContext';
import { IdentityProvider } from './context/IdentityContext';
import App from './App';
import './styles/globals.css';
import { attachRuntimeErrorHandlers } from './lib/runtime/runtimeErrors';

attachRuntimeErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MemoryProvider>
        <AvatarProvider>
          <IdentityProvider>
            <App />
          </IdentityProvider>
        </AvatarProvider>
      </MemoryProvider>
    </BrowserRouter>
  </StrictMode>
);
