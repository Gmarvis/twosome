import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-bg text-ink">
          <h2 className="font-display font-bold text-lg mb-2">something broke</h2>
          <p className="font-mono text-xs text-ink-50 mb-4 text-center max-w-xs break-words">
            {this.state.error?.message || "unknown error"}
          </p>
          <button
            className="font-mono text-sm underline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
          >
            go home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
