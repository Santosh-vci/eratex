"use client";

import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Database,
  Factory,
  FileText,
  Gauge,
  Home,
  LogOut,
  Menu,
  PackageCheck,
  PanelRight,
  Route,
  ScanLine,
  Settings,
  Shirt,
  User,
  UsersRound,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect } from "react";

import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/providers/PermissionProvider";
import { LoadingState } from "@/shared/states/LoadingState";

type NavItem = {
  href: string;
  label: string;
  permission?: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home, group: "Foundation", permission: "foundation.view" },
  { href: "/me", label: "My Access", icon: User, group: "Foundation", permission: "foundation.view" },
  {
    href: "/foundation/components",
    label: "Components",
    icon: Settings,
    group: "Foundation",
    permission: "foundation.view",
  },
  {
    href: "/master-data/governance",
    label: "Governance",
    icon: Database,
    group: "Technical",
    permission: "master_data.view",
  },
  {
    href: "/technical/styles",
    label: "Styles",
    icon: FileText,
    group: "Technical",
    permission: "master_data.view",
  },
  {
    href: "/technical/bom",
    label: "BOM",
    icon: ClipboardList,
    group: "Technical",
    permission: "master_data.view",
  },
  {
    href: "/technical/operation-bulletins",
    label: "Bulletins",
    icon: Route,
    group: "Technical",
    permission: "bulletin.view",
  },
  {
    href: "/technical/operator-skill-capacity",
    label: "Skills",
    icon: UsersRound,
    group: "Technical",
    permission: "skill_matrix.view",
  },
  { href: "/orders", label: "Orders", icon: ClipboardCheck, group: "Operations", permission: "orders.view" },
  { href: "/pcd-readiness", label: "PCD", icon: Gauge, group: "Operations", permission: "pcd.view" },
  {
    href: "/planning/weekly",
    label: "Planning",
    icon: CalendarDays,
    group: "Operations",
    permission: "planning.view",
  },
  {
    href: "/releases/daily",
    label: "Daily Release",
    icon: Factory,
    group: "Operations",
    permission: "release.view",
  },
  {
    href: "/workcenters/load",
    label: "Workcenters",
    icon: BarChart3,
    group: "Operations",
    permission: "workcenters.view",
  },
  { href: "/sewing/line-loading", label: "Sewing", icon: Shirt, group: "Execution", permission: "sewing.view" },
  { href: "/wash/planning", label: "Wash", icon: Waves, group: "Execution", permission: "wash.view" },
  { href: "/wip/pipeline", label: "WIP", icon: Boxes, group: "Execution", permission: "wip.view" },
  {
    href: "/exceptions/control-tower",
    label: "Exceptions",
    icon: AlertTriangle,
    group: "Control",
    permission: "exceptions.view",
  },
  {
    href: "/shipment/readiness",
    label: "Shipment",
    icon: PackageCheck,
    group: "Control",
    permission: "shipment.view",
  },
  { href: "/mobile/home", label: "Mobile", icon: ScanLine, group: "Capture", permission: "mobile.view" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading, logout } = useAuth();
  const { hasPermission } = usePermission();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !currentUser && !isLoginRoute) {
      router.replace("/login");
    }
  }, [currentUser, isLoading, isLoginRoute, router]);

  if (isLoginRoute) {
    return <div className="min-h-screen bg-surface-muted text-slate-950">{children}</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-muted p-6">
        <LoadingState label="Loading platform session" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface-muted p-6">
        <LoadingState label="Redirecting to sign in" />
      </div>
    );
  }

  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));
  const groupedNav = visibleNavItems.reduce<Record<string, NavItem[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-surface-muted text-slate-950">
      <header className="border-b border-grid-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white">
              <Menu className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Eratex Phase 2
              </p>
              <h1 className="text-lg font-semibold leading-7">Master Data Foundation</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="rounded border border-grid-border px-3 py-1">
              {currentUser.displayName}
            </span>
            <span className="rounded border border-grid-border px-3 py-1">
              ENV: {process.env.NEXT_PUBLIC_APP_ENV ?? "local"}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1 rounded border border-grid-border px-3 py-1 font-medium hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-[248px_1fr]">
        <nav className="border-b border-grid-border bg-white p-3 md:border-b-0 md:border-r">
          <div className="space-y-4">
            {Object.entries(groupedNav).map(([group, items]) => (
              <div key={group}>
                <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={
                          active
                            ? "flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-white transition-colors"
                            : "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        }
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
        <main className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-grid-border pb-3">
            <div className="text-xs text-slate-500">Role-aware shell / Session auth / API envelope</div>
            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
              <PanelRight className="h-3.5 w-3.5" aria-hidden />
              Drawer ready
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
