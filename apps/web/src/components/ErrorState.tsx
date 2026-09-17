import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load content',
  message,
  onRetry,
  retryText = 'Try Again',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 ${className}`}
    >
      <div className="p-3 bg-white rounded-full border border-rose-100 shadow-xs mb-3 text-rose-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};
