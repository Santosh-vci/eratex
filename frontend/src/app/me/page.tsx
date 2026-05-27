"use client";

import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/providers/AuthProvider";
import { getDepartments, getFactories, getLines, getWorkcenters } from "@/services/api/organization";
import { queryKeys } from "@/services/query-keys";
import { DataGrid } from "@/shared/DataGrid";
import { ModuleHeader, Panel } from "@/shared/layout";
import { StatusBadge } from "@/shared/badges";

export default function MePage() {
  const currentUser = useCurrentUser();
  const factories = useQuery({ queryKey: queryKeys.factories, queryFn: getFactories });
  const departments = useQuery({ queryKey: queryKeys.departments, queryFn: getDepartments });
  const workcenters = useQuery({ queryKey: queryKeys.workcenters, queryFn: getWorkcenters });
  const lines = useQuery({ queryKey: queryKeys.lines, queryFn: getLines });

  return (
    <section>
      <ModuleHeader
        title="My Access"
        description="Current session, permissions, scopes, and seeded organization records."
      />
      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title={currentUser?.displayName ?? "Current user"} eyebrow="Session">
          <p className="text-sm text-slate-500">{currentUser?.username}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentUser?.roles.map((role) => <StatusBadge key={role.code} status={role.code} />)}
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Permissions
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentUser?.permissions.map((permission) => (
                <StatusBadge key={permission} status={permission} />
              ))}
            </div>
          </div>
        </Panel>
        <div className="space-y-3">
          <DataGrid
            data={factories.data ?? []}
            isLoading={factories.isLoading}
            error={factories.error ? "Factories failed to load." : null}
            columns={[
              { accessorKey: "code", header: "Factory" },
              { accessorKey: "name", header: "Name" },
              { accessorKey: "timezone", header: "Timezone" },
            ]}
          />
          <div className="grid gap-3 xl:grid-cols-3">
            <DataGrid
              data={departments.data ?? []}
              isLoading={departments.isLoading}
              error={departments.error ? "Departments failed to load." : null}
              columns={[
                { accessorKey: "code", header: "Dept" },
                { accessorKey: "departmentType", header: "Type" },
              ]}
            />
            <DataGrid
              data={workcenters.data ?? []}
              isLoading={workcenters.isLoading}
              error={workcenters.error ? "Workcenters failed to load." : null}
              columns={[
                { accessorKey: "code", header: "Workcenter" },
                { accessorKey: "workcenterType", header: "Type" },
              ]}
            />
            <DataGrid
              data={lines.data ?? []}
              isLoading={lines.isLoading}
              error={lines.error ? "Lines failed to load." : null}
              columns={[
                { accessorKey: "code", header: "Line" },
                { accessorKey: "lineType", header: "Type" },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
