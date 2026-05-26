"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "Orders" },
  { href: "/pcd-readiness", label: "PCD" },
  { href: "/planning/weekly", label: "Planning" },
  { href: "/releases/daily", label: "Release" },
  { href: "/workcenters/load", label: "Capacity" },
  { href: "/sewing/line-loading", label: "Sewing" },
  { href: "/wash/planning", label: "Wash" },
  { href: "/wip/pipeline", label: "WIP" },
  { href: "/exceptions/control-tower", label: "Exceptions" },
  { href: "/shipment/readiness", label: "Shipment" },
  { href: "/mobile/home", label: "Mobile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-muted text-slate-950">
      <header className="border-b border-grid-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Eratex Phase 0
            </p>
            <h1 className="text-lg font-semibold leading-7">Planning Foundation</h1>
          </div>
          <div className="rounded border border-grid-border px-3 py-1 text-xs text-slate-600">
            ENV: {process.env.NEXT_PUBLIC_APP_ENV ?? "local"}
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-[240px_1fr]">
        <nav className="border-b border-grid-border bg-white p-3 md:border-b-0 md:border-r">
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded bg-primary px-3 py-2 text-sm font-medium text-white"
                      : "rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

