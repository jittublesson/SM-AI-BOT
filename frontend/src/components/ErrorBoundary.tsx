import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error caught by boundary:", error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#040810] text-slate-100 p-6 font-sans">
          <div className="max-w-md w-full bg-[#0d1424] border border-red-500/20 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-black tracking-wider uppercase text-red-400">Terminal Exception Detected</h1>
              <p className="text-xs text-brand-muted leading-relaxed">
                WealthPilot encountered a runtime exception during coordinate synchronization. The workspace process has been sandboxed to prevent database corruption.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-black/40 rounded-lg text-left border border-light-border/10">
                <span className="font-mono text-[9px] font-bold text-red-400 uppercase block mb-1">Exception Vector:</span>
                <p className="font-mono text-[10px] text-slate-300 leading-normal break-all m-0">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2 text-slate-400 cursor-pointer">
                    <summary className="font-mono text-[9px] text-brand-muted hover:text-slate-300 uppercase">View Trace Stack</summary>
                    <pre className="font-mono text-[9px] text-slate-500 overflow-x-auto whitespace-pre-wrap mt-2 max-h-40 leading-tight">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase rounded-lg transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Terminal Connection
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
