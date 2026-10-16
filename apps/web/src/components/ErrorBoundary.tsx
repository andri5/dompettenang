/**
 * Catch render errors so the whole app does not go blank.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-soft)]">
            <p className="font-display text-xl font-bold text-ink">Terjadi kesalahan</p>
            <p className="mt-2 text-sm text-muted">
              Halaman gagal ditampilkan. Muat ulang untuk melanjutkan.
            </p>
            {this.state.message ? (
              <p className="mt-3 break-words rounded-xl bg-mist/60 px-3 py-2 text-left text-xs text-muted">
                {this.state.message}
              </p>
            ) : null}
            <Button
              type="button"
              variant="gradient"
              className="mt-5 w-full"
              onClick={this.handleReload}
            >
              Muat ulang
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
