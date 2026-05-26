"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useAuth } from "@/providers/AuthProvider";

type PermissionContextValue = {
  permissions: Set<string>;
  hasPermission: (permission: string) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const permissions = new Set(currentUser?.permissions ?? []);
  const hasPermission = (permission: string) =>
    Boolean(currentUser?.isSuperuser || permissions.has(permission));

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within PermissionProvider");
  }
  return context;
}
