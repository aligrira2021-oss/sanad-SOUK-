import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Simulated Crash Analytics
    console.warn('Crash Analytics Reporting Event [Simulated]:', {
       event: 'UI_CRASH',
       error: error.message,
       stack: errorInfo.componentStack,
       timestamp: new Date().toISOString()
    });
    // In actual production: e.g. Sentry.captureException(error)
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 dir-rtl text-white">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">عذراً، حدث خطأ غير متوقع</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                واجه التطبيق مشكلة أثناء تحميل هذه الصفحة. يرجى محاولة تحديث الصفحة أو العودة لاحقاً.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              <span>تحديث الصفحة</span>
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-black/50 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono text-red-400">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
