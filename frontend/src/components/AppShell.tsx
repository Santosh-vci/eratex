"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock3,
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
  Search,
  Settings,
  Shirt,
  User,
  UsersRound,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

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

type BreadcrumbItem = {
  label: string;
  href?: string;
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
  {
    href: "/orders",
    label: "Orders",
    icon: ClipboardCheck,
    group: "Pre-Production",
    permission: "orders.view",
  },
  {
    href: "/procurement/vendor-follow-up",
    label: "Procurement",
    icon: PackageCheck,
    group: "Pre-Production",
    permission: "procurement.view",
  },
  {
    href: "/fabric/qc",
    label: "Fabric QC",
    icon: ScanLine,
    group: "Pre-Production",
    permission: "fabric_qc.view",
  },
  {
    href: "/pcd-readiness",
    label: "PCD",
    icon: Gauge,
    group: "Pre-Production",
    permission: "pcd.view",
  },
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
    permission: "workcenters.view_load",
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

const breadcrumbLabelOverrides: Record<string, string> = {
  "/": "Home",
  "/fabric/qc": "Fabric QC",
  "/foundation/components": "Components",
  "/master-data/governance": "Master Data Governance",
  "/pcd-readiness": "PCD Readiness",
  "/planning/weekly": "Weekly Planning",
  "/procurement/vendor-follow-up": "Vendor Follow-Up",
  "/releases/daily": "Daily Release",
  "/technical/bom": "BOM",
  "/technical/operation-bulletins": "Operation Bulletins",
  "/technical/operator-skill-capacity": "Operator Skill Capacity",
  "/technical/styles": "Styles",
  "/workcenters/load": "Workcenter Load",
};

function navLabel(item: NavItem) {
  return breadcrumbLabelOverrides[item.href] ?? item.label;
}

function buildShellBreadcrumbs(
  pathname: string,
  activeNavItem: NavItem | undefined,
  groupedNav: Record<string, NavItem[]>,
): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Home" }];
  }

  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (activeNavItem?.group && activeNavItem.group !== "Foundation") {
    crumbs.push({
      label: activeNavItem.group,
      href: groupedNav[activeNavItem.group]?.[0]?.href ?? activeNavItem.href,
    });
  }

  if (pathname.startsWith("/orders/") && pathname.endsWith("/trace")) {
    crumbs.push({ label: "Orders", href: "/orders" }, { label: "Trace" });
    return crumbs;
  }

  if (pathname.startsWith("/orders/")) {
    crumbs.push({ label: "Orders", href: "/orders" }, { label: "Order Detail" });
    return crumbs;
  }

  if (pathname.startsWith("/technical/styles/")) {
    crumbs.push({ label: "Styles", href: "/technical/styles" }, { label: "Style Detail" });
    return crumbs;
  }

  if (pathname.startsWith("/technical/operation-bulletins/")) {
    crumbs.push({ label: "Operation Bulletins", href: "/technical/operation-bulletins" }, { label: "Routing" });
    return crumbs;
  }

  if (pathname.startsWith("/workcenters/") && pathname.endsWith("/queue")) {
    crumbs.push({ label: "Workcenter Load", href: "/workcenters/load" }, { label: "Queue" });
    return crumbs;
  }

  if (activeNavItem) {
    crumbs.push({ label: navLabel(activeNavItem) });
    return crumbs;
  }

  crumbs.push({
    label: pathname
      .split("/")
      .filter(Boolean)
      .map((part) => part.replace(/-/g, " "))
      .join(" / "),
  });

  return crumbs;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading, logout } = useAuth();
  const { hasPermission } = usePermission();
  const isLoginRoute = pathname === "/login";
  const [isNavExpanded, setNavExpanded] = useState(false);

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
  const activeNavItem = [...visibleNavItems]
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));
  const groupedNav = visibleNavItems.reduce<Record<string, NavItem[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});
  const shellBreadcrumbs = buildShellBreadcrumbs(pathname, activeNavItem, groupedNav);

  return (
    <div className="ops-shell">
      <header className="ops-topbar">
        <div className="flex h-full w-64 items-center gap-3 border-r border-grid-border px-3">
          <button
            type="button"
            onClick={() => setNavExpanded((expanded) => !expanded)}
            aria-expanded={isNavExpanded}
            aria-label={isNavExpanded ? "Collapse navigation" : "Expand navigation"}
            className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <Menu className="h-4 w-4" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
              ERATEX OPS CONTROL
            </p>
            <h1 className="truncate text-sm font-semibold leading-5 text-slate-950">
              {activeNavItem?.label ?? "Operating Spine"}
            </h1>
          </div>
        </div>
        <div className="flex h-full min-w-0 flex-1 items-center gap-2 px-3">
          <button type="button" className="ops-button hidden lg:inline-flex" aria-label="Factory selector">
            <Factory className="h-3.5 w-3.5" aria-hidden />
            Unit 01
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button type="button" className="ops-button hidden md:inline-flex" aria-label="Planning horizon selector">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            This Week
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div className="relative min-w-[180px] flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              aria-label="Global search"
              className="h-8 w-full rounded border border-grid-border bg-white pl-8 pr-3 text-xs outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="Search PO, order, style, customer"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="ops-button px-2" aria-label="Critical alerts">
              <Bell className="h-4 w-4 text-risk-action" aria-hidden />
              <span className="font-mono text-[11px]">03</span>
            </button>
            <span className="hidden items-center gap-1 font-mono text-[11px] text-slate-500 md:inline-flex">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              SYNC 2M AGO
            </span>
            <span className="hidden rounded border border-grid-border px-2 py-1 text-xs text-slate-600 xl:inline">
              {process.env.NEXT_PUBLIC_APP_ENV ?? "local"}
            </span>
            <span className="hidden rounded border border-grid-border px-2 py-1 text-xs font-medium text-slate-700 lg:inline">
              {currentUser.displayName}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="ops-button px-2"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <nav
        className={
          isNavExpanded
            ? "ops-rail overflow-x-visible overflow-y-auto px-3 py-3 transition-[width,padding] duration-200 ease-out"
            : "ops-rail overflow-x-visible overflow-y-auto px-2 py-3 transition-[width,padding] duration-200 ease-out"
        }
        style={{ width: isNavExpanded ? 240 : 64 }}
        aria-label="Primary navigation"
      >
        <div className="space-y-3">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} className="border-b border-grid-border pb-2 last:border-b-0">
              <p
                className={
                  isNavExpanded
                    ? "mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400"
                    : "mb-1 text-center text-[9px] font-bold uppercase tracking-[0.05em] text-slate-400"
                }
                title={group}
              >
                {isNavExpanded ? group : group.slice(0, 2)}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const linkClass = active
                    ? isNavExpanded
                      ? "group relative flex h-10 w-full items-center gap-3 rounded bg-primary px-3 text-white transition-colors"
                      : "group relative flex h-10 w-10 items-center justify-center rounded bg-primary text-white transition-colors"
                    : isNavExpanded
                      ? "group relative flex h-10 w-full items-center gap-3 rounded px-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                      : "group relative flex h-10 w-10 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      className={linkClass}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {active ? <span className="absolute -left-2 top-2 h-6 w-1 rounded-r bg-risk-watch" /> : null}
                      {isNavExpanded ? (
                        <span className="truncate text-xs font-semibold">{item.label}</span>
                      ) : (
                        <>
                          <span className="sr-only">{item.label}</span>
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute left-12 z-50 hidden whitespace-nowrap rounded border border-grid-border bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm group-hover:block group-focus:block"
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <main
        className="ops-workarea transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: isNavExpanded ? 256 : 80 }}
      >
        <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[11px] uppercase text-slate-500">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1">
            {shellBreadcrumbs.map((crumb, index) => {
              const isLast = index === shellBreadcrumbs.length - 1;
              return (
                <span key={`${crumb.href ?? crumb.label}-${index}`} className="inline-flex items-center gap-1">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="rounded-sm text-slate-500 transition-colors hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-secondary/25"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-slate-700" : undefined}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast ? <span className="text-slate-300">/</span> : null}
                </span>
              );
            })}
          </nav>
          <span className="inline-flex items-center gap-1">
            <PanelRight className="h-3.5 w-3.5" aria-hidden />
            Drawer pattern active
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
