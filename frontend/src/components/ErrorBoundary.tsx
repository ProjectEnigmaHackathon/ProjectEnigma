/**
 * Error Boundary Components
 * 
 * Comprehensive error boundary implementation with retry functionality,
 * error reporting, and graceful fallback UI.
 */

import React, { Component, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorInfo?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  enableRetry?: boolean;
  showErrorDetails?: boolean;
}

/**
 * Main Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    
    const customErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      errorInfo: errorInfo.errorInfo,
    };

    this.setState({
      errorInfo: customErrorInfo,
      errorId,
    });

    // Log error details for debugging
    console.error('Error Boundary caught an error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, customErrorInfo, errorId);
    }

    // Report error to monitoring service (in production)
    this.reportError(error, customErrorInfo, errorId);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // In production, send error to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorId,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached for error ${this.state.errorId}`);
      return;
    }

    console.log(`Retrying... (attempt ${retryCount + 1}/${maxRetries})`);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleRetryWithDelay = (delay: number = 1000) => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { hasError, error, errorInfo, errorId, showDetails, retryCount } = this.state;
    const { 
      fallback, 
      enableRetry = true, 
      showErrorDetails = true, 
      maxRetries = 3,
      children 
    } = this.props;

    if (hasError) {
      // Custom fallback UI provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                {/* Error Message */}
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  We encountered an unexpected error. Please try again or reload the page.
                </p>

                {/* Error ID */}
                <p className="mt-2 text-xs text-gray-400">
                  Error ID: {errorId}
                </p>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {enableRetry && retryCount < maxRetries && (
                    <div className="space-y-2">
                      <Button
                        onClick={this.handleRetry}
                        className="w-full"
                        variant="primary"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={() => this.handleRetryWithDelay(2000)}
                        className="w-full"
                        variant="secondary"
                      >
                        Retry in 2 seconds
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={this.handleReload}
                    className="w-full"
                    variant="secondary"
                  >
                    Reload Page
                  </Button>

                  {showErrorDetails && (
                    <Button
                      onClick={this.toggleDetails}
                      className="w-full"
                      variant="outline"
                    >
                      {showDetails ? 'Hide' : 'Show'} Error Details
                    </Button>
                  )}
                </div>

                {/* Retry Information */}
                {retryCount > 0 && (
                  <p className="mt-4 text-xs text-gray-500">
                    Retry attempt: {retryCount}/{maxRetries}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Details Modal */}
          {showDetails && (
            <Modal
              isOpen={showDetails}
              onClose={this.toggleDetails}
              title="Error Details"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Error Message</h4>
                  <p className="mt-1 text-sm text-red-600 font-mono">
                    {error?.message || 'Unknown error'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Error ID</h4>
                  <p className="mt-1 text-sm text-gray-600 font-mono">{errorId}</p>
                </div>

                {error?.stack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Stack Trace</h4>
                    <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Component Stack</h4>
                    <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button onClick={this.toggleDetails} variant="secondary">
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify({ error: error?.message, stack: error?.stack, errorId }, null, 2)
                      );
                    }}
                    variant="outline"
                  >
                    Copy Error Info
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      );
    }

    return children;
  }
}

/**
 * Async Error Boundary for handling async errors in components
 */
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const [asyncError, setAsyncError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      setAsyncError(error);
      onError?.(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (asyncError) {
    throw asyncError;
  }

  return <>{children}</>;
};

/**
 * Workflow Error Boundary - Specialized for workflow-related errors
 */
export const WorkflowErrorBoundary: React.FC<{
  children: ReactNode;
  onWorkflowError?: (error: Error, workflowId?: string) => void;
  workflowId?: string;
}> = ({ children, onWorkflowError, workflowId }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    console.error('Workflow error:', { error, workflowId, errorId });
    onWorkflowError?.(error, workflowId);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      enableRetry={true}
      maxRetries={2}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Workflow Error
              </h3>
              <p className="mt-2 text-sm text-red-700">
                There was an error in the workflow execution. 
                {workflowId && ` (Workflow ID: ${workflowId})`}
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Restart Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Utility function to generate unique error IDs
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export types for use in other components
export type { ErrorInfo, ErrorBoundaryProps, ErrorBoundaryState };