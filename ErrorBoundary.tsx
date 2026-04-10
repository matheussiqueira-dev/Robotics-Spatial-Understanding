import {Component, type ErrorInfo, type ReactNode} from 'react';

type Props = {children: ReactNode};

type State = {hasError: boolean; message: string};

/**
 * Top-level React error boundary.
 *
 * Catches any uncaught render-phase or lifecycle error and renders a minimal
 * fallback UI so the page never shows a blank screen. The original error
 * message is displayed to aid debugging without leaking a raw stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'Erro inesperado na aplicacao.';
    return {hasError: true, message};
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught error', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2>Algo deu errado</h2>
          <p>{this.state.message}</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              this.setState({hasError: false, message: ''});
            }}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
