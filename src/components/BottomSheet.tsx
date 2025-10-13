import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.4, 0.9],
  defaultSnap = 0,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 100;

    if (deltaY > threshold) {
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold && currentSnap < snapPoints.length - 1) {
      setCurrentSnap(currentSnap + 1);
    }

    setStartY(0);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  const heightPercent = snapPoints[currentSnap] * 100;
  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 bg-gray-900 rounded-t-3xl shadow-2xl z-50 transition-transform touch-none"
        style={{
          height: `${heightPercent}%`,
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-6 pt-16 pb-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto h-full pb-safe" style={{ paddingTop: title ? '0' : '3rem' }}>
          {children}
        </div>
      </div>
    </>
  );
}
