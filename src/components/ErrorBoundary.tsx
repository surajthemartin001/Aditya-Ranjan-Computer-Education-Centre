import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error) {
        readable = `Database operation (${parsed.operationType} on ${parsed.path || 'record'}) could not be completed: ${parsed.error}`;
      }
    } catch {
      // keep standard message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{this.state.message}</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Return to Home
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
