import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/30 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Something went wrong</h1>
                <p className="text-xs text-slate-400">The component failed to render safely.</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-rose-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown rendering error'}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white bg-slate-855 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
