"use client";

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

import { EmptyState } from "@/shared/states/EmptyState";
import { ErrorState } from "@/shared/states/ErrorState";
import { LoadingState } from "@/shared/states/LoadingState";

type DataGridProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
};

export function DataGrid<T>({ data, columns, isLoading = false, error, onRowClick }: DataGridProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) {
    return <LoadingState label="Loading grid data" />;
  }
  if (error) {
    return <ErrorState title="Grid unavailable" message={error} />;
  }
  if (data.length === 0) {
    return <EmptyState title="No records" message="No records match the current view." />;
  }

  return (
    <div className="overflow-auto border border-grid-border bg-white">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-b border-grid-border px-3 py-2 font-semibold text-slate-600">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={onRowClick ? "cursor-pointer hover:bg-slate-50" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b border-grid-border px-3 py-2 text-slate-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
