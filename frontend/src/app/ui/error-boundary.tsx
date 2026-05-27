// src/app/ui/error-boundary.tsx
import React, { Component, ReactNode } from 'react';
import { Button } from '@/app/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    void error;
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    void error;
    void info;
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally reload page
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={cn('flex flex-col items-center justify-center min-h-screen p-4', 'bg-white dark:bg-zinc-950')}> 
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <p className="text-gray-600 mb-6">Please try refreshing the page.</p>
          <Button onClick={this.handleReset}>Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
