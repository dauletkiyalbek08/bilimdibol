"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem, DropdownLabel } from "@/components/ui/dropdown";

/** Demo export — simulates a download with a transient confirmation. */
export function ExportButton({ label = "Экспорт" }: { label?: string }) {
  const [done, setDone] = React.useState<string | null>(null);

  function fakeDownload(kind: string) {
    setDone(kind);
    window.setTimeout(() => setDone(null), 1800);
  }

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm">
          {done ? <Check className="text-brand" /> : <Download />}
          {done ? `${done} готов` : label}
        </Button>
      }
    >
      <DropdownLabel>Формат экспорта</DropdownLabel>
      <DropdownItem onClick={() => fakeDownload("PDF")}>
        <FileText className="size-4 text-red-500" /> Скачать PDF
      </DropdownItem>
      <DropdownItem onClick={() => fakeDownload("Excel")}>
        <FileSpreadsheet className="size-4 text-brand" /> Скачать Excel
      </DropdownItem>
    </Dropdown>
  );
}
