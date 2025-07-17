import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = "Ha ocurrido un error inesperado",
  } = options;

  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  });

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      if (logError) {
        console.error("Error handled:", errorObj);
      }

      setErrorState({
        error: errorObj,
        isError: true,
      });

      if (showToast) {
        toast({
          title: "Error",
          description: customMessage || errorObj.message || fallbackMessage,
          variant: "destructive",
        });
      }

      return errorObj;
    },
    [toast, showToast, logError, fallbackMessage]
  );

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      customMessage?: string
    ): Promise<T | null> => {
      try {
        clearError();
        return await asyncFn();
      } catch (error) {
        handleError(error, customMessage);
        return null;
      }
    },
    [handleError, clearError]
  );

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    handleAsyncError,
  };
}
