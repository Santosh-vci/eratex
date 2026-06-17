import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { LaundrySchedulerMock } from "./LaundrySchedulerMock";

test("renders laundry scheduler thesis landmarks", () => {
  render(<LaundrySchedulerMock />);

  expect(screen.getByRole("heading", { name: "Laundry Scheduler" })).toBeInTheDocument();
  expect(screen.getByLabelText("Laundry KPI strip")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Laundry flow map" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Live Flow" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "Machine and resource load board" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Selected batch inspector" })).toBeInTheDocument();
  expect(screen.getByText("Current active CCR: Dryer / next likely CCR: Laser-PP")).toBeInTheDocument();
});

test("opens KPI and capacity drill modals without route navigation", () => {
  render(<LaundrySchedulerMock />);

  fireEvent.click(screen.getByRole("button", { name: /Idle hours/i }));
  expect(screen.getByRole("dialog", { name: "KPI: Idle hours" })).toBeInTheDocument();
  expect(screen.getByText("Affected machines, batches, and orders")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Close modal"));

  fireEvent.click(screen.getByRole("tab", { name: "Capacity Board" }));
  fireEvent.click(screen.getByRole("button", { name: /18 Jun B.*220 min overload/i }));
  expect(screen.getByRole("dialog", { name: "Dryer / 18 Jun B" })).toBeInTheDocument();
  expect(screen.getByText("Recovery action")).toBeInTheDocument();
});

test("builds a batch and previews governed impact", () => {
  render(<LaundrySchedulerMock />);

  fireEvent.click(screen.getByRole("tab", { name: "Batch Builder" }));
  fireEvent.click(screen.getByLabelText("Select ORD-1092"));
  fireEvent.click(screen.getByRole("button", { name: "Add selected demand" }));

  const composition = screen.getByRole("heading", { name: "Batch composition" }).closest("section");
  expect(composition).not.toBeNull();
  expect(within(composition as HTMLElement).getByText("ORD-1092")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Preview batch creation" }));
  expect(screen.getByRole("dialog", { name: "Batch creation impact preview" })).toBeInTheDocument();
  expect(screen.getByText("Before")).toBeInTheDocument();
  expect(screen.getByText("After")).toBeInTheDocument();
});

test("supports timeline drill, idle capture, and exception approval", () => {
  render(<LaundrySchedulerMock />);

  fireEvent.click(screen.getByRole("tab", { name: "Machine Timeline" }));
  fireEvent.click(screen.getByRole("button", { name: "W-204 Tonello 125-1 10:00" }));
  expect(screen.getByRole("dialog", { name: "Batch detail W-204" })).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Close modal"));

  fireEvent.click(screen.getByRole("button", { name: "Capture idle reason Idle Dryer 02 12:00" }));
  expect(screen.getByRole("dialog", { name: "Idle reason Dryer 02 12:00" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Capture reason" }));
  expect(screen.getByRole("status")).toHaveTextContent("Idle reason captured for Dryer 02");

  fireEvent.click(screen.getByRole("tab", { name: "Exceptions" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Preview" })[0]);
  expect(screen.getByRole("dialog", { name: "Exception approval EX-501" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Approve exception" }));
  expect(screen.getByRole("status")).toHaveTextContent("EX-501 approved");
  expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
});
