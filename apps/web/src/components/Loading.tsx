import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  label = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} />
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};
