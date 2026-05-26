import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, test, vi } from "vitest";

import { AuthProvider } from "@/providers/AuthProvider";
import { PermissionProvider } from "@/providers/PermissionProvider";
import { queryKeys } from "@/services/query-keys";
import { PermissionGate } from "@/shared/PermissionGate";
import type { CurrentUser } from "@/types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const user: CurrentUser = {
  id: 1,
  username: "planner",
  email: "planner@example.com",
  firstName: "Production",
  lastName: "Planner",
  displayName: "Production Planner",
  isStaff: true,
  isSuperuser: false,
  roles: [{ id: "role-1", code: "PLANNER", name: "Planner", factoryId: null }],
  permissions: ["foundation.view"],
  scopes: [],
  featureFlags: {},
};

function renderWithUser(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  queryClient.setQueryData(queryKeys.currentUser, user);
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

test("permission gate renders permitted content", () => {
  renderWithUser(<PermissionGate permission="foundation.view">Allowed</PermissionGate>);

  expect(screen.getByText("Allowed")).toBeInTheDocument();
});

test("permission gate hides restricted content", () => {
  renderWithUser(
    <PermissionGate permission="orders.release" fallback={<span>Blocked</span>}>
      Allowed
    </PermissionGate>,
  );

  expect(screen.getByText("Blocked")).toBeInTheDocument();
});
