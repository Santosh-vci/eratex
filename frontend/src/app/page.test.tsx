import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import HomePage from "./page";

test("renders the home route", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { name: "Eratex Operating Spine" })).toBeInTheDocument();
  expect(screen.queryByText("Operating Control")).not.toBeInTheDocument();
});
