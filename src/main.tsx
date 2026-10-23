import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorText: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorText: error instanceof Error ? error.message : 'Unexpected display error',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('Application ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040914] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#071329] border border-blue-800/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-white">A.A. Master Nig. Limited Portal</h2>
            <p className="text-xs text-slate-300">
              A temporary session or display synchronization issue occurred ({this.state.errorText}).
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs"
              >
                Reload Portal
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('sokoto_cement_trailer_cart');
                  localStorage.removeItem('sokoto_cement_auth_token');
                  window.location.reload();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Reset Local Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
