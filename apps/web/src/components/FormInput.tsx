import React, { InputHTMLAttributes } from 'react';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};
