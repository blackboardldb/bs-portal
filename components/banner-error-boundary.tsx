"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface BannerErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class BannerErrorBoundary extends React.Component<
  BannerErrorBoundaryProps,
  BannerErrorBoundaryState
> {
  constructor(props: BannerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BannerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Banner Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Error al cargar banners
                </h3>
                <p className="text-xs text-red-600 mt-1">
                  Hubo un problema al mostrar los banners. Por favor, intenta
                  nuevamente.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useBannerErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Banner error:", error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
