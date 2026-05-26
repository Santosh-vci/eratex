import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RiskBadge, StatusBadge } from "@/shared/badges";

test("status and risk badges render labels", () => {
  render(
    <div>
      <StatusBadge status="PCD_READY" />
      <RiskBadge risk="ACTION" />
    </div>,
  );

  expect(screen.getByText("PCD READY")).toBeInTheDocument();
  expect(screen.getByText("ACTION")).toBeInTheDocument();
});
