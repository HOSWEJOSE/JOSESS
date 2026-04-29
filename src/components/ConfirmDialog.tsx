import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colorClasses = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const colors = colorClasses[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className={`${colors.bg} border-b-2 ${colors.border} p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-gray-700 text-sm sm:text-lg mb-4 sm:mb-6">{message}</p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm sm:text-base"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 ${colors.button} text-white rounded-lg transition font-semibold shadow-lg text-sm sm:text-base`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
