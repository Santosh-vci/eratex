"use client";

import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm border border-grid-border bg-white p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-[13px] leading-[18px] text-slate-600">{message}</p>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="ops-button">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="ops-button ops-button-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
