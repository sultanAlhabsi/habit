export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export const initialErrorBoundaryState: ErrorBoundaryState = {
  hasError: false,
  error: null,
};

export function getDerivedStateFromError(error: Error): ErrorBoundaryState {
  return { hasError: true, error };
}
