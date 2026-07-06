"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * Reusable modal/dialog component with:
 * - Focus trap
 * - Escape key handling
 * - Backdrop click to close
 * - Accessible ARIA attributes
 */
export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus the dialog on open
    dialogRef.current?.focus();

    // Store previously focused element to restore on close
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleBackdropClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleBackdropClick);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "w-full rounded-2xl shadow-2xl overflow-hidden bg-card animate-in fade-in zoom-in-95 outline-none",
          maxWidth
        )}
      >
        <div className="p-5 bg-primary text-white">
          <h3 id="modal-title" className="font-bold text-xl">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
