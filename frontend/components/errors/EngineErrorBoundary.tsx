import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  name: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class EngineErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="text-center text-xs text-nova-muted/80 px-6">{this.props.name} tijdelijk offline</p>
        )
      );
    }
    return this.props.children;
  }
}
