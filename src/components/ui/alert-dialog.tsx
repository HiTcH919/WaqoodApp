"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  variant?: "info" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = "info",
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
        className={cn(
          "w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95",
          "bg-card"
        )}
      >
        <div
          className={cn(
            "p-5 text-white flex items-center gap-3",
            variant === "danger" ? "bg-destructive" : "bg-primary"
          )}
        >
          <h3 className="font-bold text-xl">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-foreground text-lg mb-8 leading-relaxed font-medium">{message}</p>
          <div className="flex justify-end gap-3">
            {onConfirm && (
              <button
                onClick={() => onOpenChange(false)}
                className="px-5 py-2.5 rounded-xl text-foreground bg-secondary hover:bg-accent font-bold transition"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm?.();
                onOpenChange(false);
              }}
              className={cn(
                "px-6 py-2.5 rounded-xl text-white font-bold transition shadow-md",
                variant === "danger"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:opacity-90"
              )}
            >
              {onConfirm ? confirmLabel : "حسناً"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
