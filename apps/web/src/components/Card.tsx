import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, action, className = '', children }) => {
  if (children) {
    return <div className={`p-5 pb-3 border-b border-slate-100 ${className}`}>{children}</div>;
  }
  return (
    <div className={`p-5 pb-3 flex items-start justify-between border-b border-slate-100 ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-slate-50/50 rounded-b-xl border-t border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};
