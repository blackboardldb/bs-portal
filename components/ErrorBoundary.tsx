"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error?: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
        <p className="text-gray-400 mb-4">
          Ha ocurrido un error inesperado. Por favor, intenta recargar la
          página.
        </p>
        {error && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Detalles del error
            </summary>
            <pre className="text-xs text-red-400 mt-2 p-2 bg-zinc-800 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <div className="space-y-2">
          <Button
            onClick={resetError}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full border-zinc-600 text-white hover:bg-zinc-800"
          >
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
export { DefaultErrorFallback };
