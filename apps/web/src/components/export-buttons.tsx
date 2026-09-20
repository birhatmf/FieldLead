"use client";

import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

interface ExportButtonsProps {
  resource: "leads" | "search";
  searchId?: string;
}

const FORWARDED_FILTERS = [
  "search",
  "category",
  "minRating",
  "minReviewCount",
  "hasPhone",
  "hasWebsite",
  "hasEmail",
  "status",
];

export function ExportButtons({ resource, searchId }: ExportButtonsProps) {
  const searchParams = useSearchParams();

  const params = new URLSearchParams();

  for (const key of FORWARDED_FILTERS) {
    const value = searchParams.get(key);

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  const base =
    resource === "leads"
      ? `${API_URL}/exports/leads`
      : `${API_URL}/exports/searches/${searchId}`;

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={`${base}.csv${suffix}`} download>
          <FileText aria-hidden="true" className="size-4" />
          CSV
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={`${base}.xlsx${suffix}`} download>
          <FileSpreadsheet aria-hidden="true" className="size-4" />
          Excel
        </a>
      </Button>
    </div>
  );
}
