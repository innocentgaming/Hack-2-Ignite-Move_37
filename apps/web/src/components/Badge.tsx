import React from 'react';

export type BadgeVariant =
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'default'
  | 'outline'
  | 'primary';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}) => {
  // Normalize alias variants to curated design system tokens
  const normalizedVariant: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' = (() => {
    switch (variant) {
      case 'success':
        return 'emerald';
      case 'warning':
        return 'amber';
      case 'destructive':
        return 'rose';
      case 'primary':
        return 'indigo';
      case 'outline':
      case 'default':
        return 'slate';
      default:
        return variant || 'slate';
    }
  })();

  const variantStyles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotColors = {
    slate: 'bg-slate-400',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[normalizedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[normalizedVariant]}`} />}
      {children}
    </span>
  );
};
