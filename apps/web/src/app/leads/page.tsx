import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { ExportButtons } from "@/components/export-buttons";
import { LeadsTable } from "@/components/leads-table";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState } from "@/components/states";
import { api, ApiError } from "@/lib/api";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Lead, Paginated } from "@/lib/types";

export const metadata = { title: "Leadler" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage({
  searchParams,
}: PageProps<"/leads">) {
  const raw = (await searchParams) as SearchParams;
  const status = first(raw.status);
  const page = Math.max(1, Number(first(raw.page) ?? 1) || 1);

  let leads: Paginated<Lead> | null = null;
  let errorMessage: string | null = null;

  try {
    leads = await api.listLeads({
      page,
      pageSize: 50,
      ...(status ? { status } : {}),
    });
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Beklenmeyen bir hata oluştu.";
  }

  const filters: Array<{ value?: string; label: string }> = [
    { label: "Tümü" },
    ...LEAD_STATUS_ORDER.map((value) => ({
      value,
      label: LEAD_STATUS_LABELS[value],
    })),
  ];

  return (
    <>
      <PageHeader
        title="Leadler"
        description="Araştırma sonuçlarından lead'e dönüştürülen işletmeler."
      >
        <Suspense fallback={null}>
          <ExportButtons resource="leads" />
        </Suspense>
      </PageHeader>

      <nav aria-label="Durum filtresi" className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = (status ?? undefined) === filter.value;
          const href = filter.value ? `/leads?status=${filter.value}` : "/leads";

          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {!leads ? (
        <ErrorState message={errorMessage ?? "Veri alınamadı."} />
      ) : leads.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Lead bulunamadı"
          description={
            status
              ? "Bu durumda lead yok. Farklı bir filtre deneyin."
              : "Henüz lead oluşturulmadı. Araştırma sonuçlarından işletme seçip lead olarak kaydedin."
          }
        />
      ) : (
        <>
          <LeadsTable leads={leads.items} />
          <Pagination
            basePath="/leads"
            params={status ? { status } : {}}
            page={leads.page}
            totalPages={leads.totalPages}
            total={leads.total}
            pageSize={leads.pageSize}
          />
        </>
      )}
    </>
  );
}
