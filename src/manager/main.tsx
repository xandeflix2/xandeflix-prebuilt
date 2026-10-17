import React from 'react';
import ReactDOM from 'react-dom/client';
import { createManagerApplication } from './ManagerApplication.tsx';
import '../index.css';

declare const __XANDEFLIX_MANAGER_PUBLIC_CONFIG__: { url: string; publishableKey: string };
if (typeof __XANDEFLIX_MANAGER_PUBLIC_CONFIG__ !== 'undefined') {
  const runtime = globalThis as typeof globalThis & {
    __XANDEFLIX_RUNTIME_CONFIG__?: { supabase: { url: string; publishableKey: string } };
  };
  runtime.__XANDEFLIX_RUNTIME_CONFIG__ = { supabase: __XANDEFLIX_MANAGER_PUBLIC_CONFIG__ };
}
const application = createManagerApplication(window.location);
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{application}</React.StrictMode>);
