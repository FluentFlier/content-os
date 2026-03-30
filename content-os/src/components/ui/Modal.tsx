'use client';

import { useEffect, useCallback, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1714]/30 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAFAF8] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-6 w-full max-w-md space-y-4">
        {title && (
          <h3 className="font-display text-lg font-bold text-[#1A1714]">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
