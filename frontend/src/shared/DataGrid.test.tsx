import { fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { expect, test, vi } from "vitest";

import { DataGrid } from "@/shared/DataGrid";

type Row = { code: string; name: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "code", header: "Code" },
  { accessorKey: "name", header: "Name" },
];

test("data grid renders rows and handles row click", () => {
  const onRowClick = vi.fn();
  render(<DataGrid data={[{ code: "EOS-01", name: "Foundation" }]} columns={columns} onRowClick={onRowClick} />);

  fireEvent.click(screen.getByText("EOS-01"));

  expect(screen.getByText("Foundation")).toBeInTheDocument();
  expect(onRowClick).toHaveBeenCalledWith({ code: "EOS-01", name: "Foundation" });
});

test("data grid renders empty state", () => {
  render(<DataGrid data={[]} columns={columns} />);

  expect(screen.getByText("No records")).toBeInTheDocument();
});
