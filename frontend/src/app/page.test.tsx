import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import HomePage from "./page";

test("renders the Phase 2 home route", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { name: "Eratex Operating Spine" })).toBeInTheDocument();
  expect(screen.getByText("Phase 2")).toBeInTheDocument();
});
