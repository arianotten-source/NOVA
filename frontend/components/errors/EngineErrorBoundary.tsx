import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  name: string;
  fallback?: ReactNode;
  children: ReactNode;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export default class EngineErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: null });
    }
  }

  private retry = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-4 text-center">
          <p className="text-xs text-nova-muted/90">{this.props.name} tijdelijk offline</p>
          {this.state.message && (
            <p className="text-[10px] text-nova-muted/60 max-w-xs truncate">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={this.retry}
            className="text-[10px] text-nova-cyan underline touch-manipulation"
          >
            Opnieuw proberen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
