import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const iconConfig = {
    info: { icon: Info, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    success: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    warning: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    danger: { icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  };

  const { icon: Icon, color } = iconConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full border shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
