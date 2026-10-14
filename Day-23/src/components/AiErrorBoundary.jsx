import React from "react";

/**
 * Day 21 - AI Feature Error Boundary & Graceful Degradation
 * Catches JavaScript/API exceptions in AI widgets (Sparky Assistant,
 * AI Copywriter, Semantic Search) and provides recovery UI without
 * crashing the rest of the application.
 */
export default class AiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AiErrorBoundary] Caught AI component failure:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 text-white shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-lg">
              🛡️
            </span>
            <div>
              <h4 className="text-sm font-bold text-white">
                {this.props.title || "AI Feature Temporarily Degraded"}
              </h4>
              <p className="text-[11px] text-slate-400">
                Operating in resilient offline fallback mode
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {this.props.message ||
              "The AI inference or vector retrieval service experienced an issue. Your e-commerce actions and standard catalog search remain 100% operational."}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-md active:scale-95"
            >
              🔄 Retry AI Connection
            </button>
            {this.props.showStandardFallback && (
              <span className="text-[11px] text-slate-400">
                Standard manual controls available below
              </span>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
