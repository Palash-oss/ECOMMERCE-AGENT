import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-bento-text dark:text-bento-darkText">
            {this.props.fallbackMessage || 'Component Rendering Recovered'}
          </h4>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-1">
            An isolated UI issue occurred. The rest of the dashboard remains fully operational.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-bento shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
