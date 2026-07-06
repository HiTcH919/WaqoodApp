"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-desc"
        tabIndex={-1}
        className={cn(
          "w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 outline-none",
          "bg-card"
        )}
      >
        <div
          className={cn(
            "p-5 text-white flex items-center gap-3",
            variant === "danger" ? "bg-destructive" : "bg-primary"
          )}
        >
          <h3 id="alert-title" className="font-bold text-xl">{title}</h3>
        </div>
        <div className="p-6">
          <p id="alert-desc" className="text-foreground text-lg mb-8 leading-relaxed font-medium">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            {onConfirm && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              onClick={() => {
                onConfirm?.();
                onOpenChange(false);
              }}
              variant={variant === "danger" ? "destructive" : "default"}
            >
              {onConfirm ? confirmLabel : "حسناً"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
