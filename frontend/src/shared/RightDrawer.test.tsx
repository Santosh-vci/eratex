import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { RightDrawer } from "@/shared/RightDrawer";

test("right drawer opens and closes", () => {
  const onClose = vi.fn();
  render(
    <RightDrawer open title="Detail drawer" onClose={onClose}>
      Drawer content
    </RightDrawer>,
  );

  expect(screen.getByRole("dialog", { name: "Detail drawer" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close drawer" }));
  expect(onClose).toHaveBeenCalledOnce();
});
