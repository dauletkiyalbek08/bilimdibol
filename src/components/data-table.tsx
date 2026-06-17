"use client";

import * as React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  activeRowKey?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  activeRowKey,
  emptyTitle = "Нет данных",
  emptyDescription = "Попробуйте изменить фильтры или период",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => (
            <TableHead key={col.key} className={cn(alignClass(col.align), col.className)}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const key = rowKey(row);
          return (
            <TableRow
              key={key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                onRowClick && "cursor-pointer",
                activeRowKey === key && "bg-brand-50/70 hover:bg-brand-50",
              )}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={cn(alignClass(col.align), col.className)}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
