import React from 'react';

export const LoadingSkeleton: React.FC<{
  className?: string;
  count?: number;
}> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-md animate-shimmer ${className}`} />
      ))}
    </div>
  );
};

export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-28" />
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-20" />
      <LoadingSkeleton className="h-3 w-36" />
    </div>
  );
};
