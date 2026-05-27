"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type RightDrawerProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  subtitle?: string;
};

export function RightDrawer({ open, title, children, onClose, subtitle }: RightDrawerProps) {
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
      className="ops-drawer transition-transform"
    >
      <div className="flex min-h-12 items-center justify-between border-b border-grid-border px-4 py-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">Action Drawer</p>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
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
      <div className="h-[calc(100vh-96px)] overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
