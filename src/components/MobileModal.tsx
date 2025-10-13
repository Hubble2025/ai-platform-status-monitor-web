import { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  fullScreen?: boolean;
}

export function MobileModal({
  isOpen,
  onClose,
  children,
  title,
  fullScreen = false,
}: MobileModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 ${
          fullScreen ? 'top-0' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          className={`bg-gray-900 ${
            fullScreen
              ? 'h-full w-full'
              : 'rounded-t-3xl md:rounded-2xl max-h-[90vh] w-full md:max-w-2xl md:m-4'
          } shadow-2xl overflow-hidden animate-slide-up md:animate-scale-in flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className={`overflow-y-auto flex-1 ${fullScreen ? 'pb-safe' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
