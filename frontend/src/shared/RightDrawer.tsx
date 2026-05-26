"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type RightDrawerProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function RightDrawer({ open, title, children, onClose }: RightDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] border-l border-grid-border bg-white shadow-xl transition-transform"
    >
      <div className="flex items-center justify-between border-b border-grid-border px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </aside>
  );
}
