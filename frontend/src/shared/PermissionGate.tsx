"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/providers/PermissionProvider";

type PermissionGateProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: "hide" | "disable";
};

export function PermissionGate({
  permission,
  children,
  fallback = null,
  mode = "hide",
}: PermissionGateProps) {
  const { hasPermission } = usePermission();
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  if (mode === "disable") {
    return <span className="pointer-events-none opacity-50">{children}</span>;
  }
  return <>{fallback}</>;
}
