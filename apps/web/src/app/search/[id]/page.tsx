import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { ExportButtons } from "@/components/export-buttons";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ResultsFilters } from "@/components/results-filters";
import { ResultsTable } from "@/components/results-table";
import { EmptyState, ErrorState } from "@/components/states";
import { SearchStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getCountryName } from "@/lib/locations";
import type { SearchDetail } from "@/lib/types";

export const metadata = { title: "Araştırma sonuçları" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/search"
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Araştırmalar
      </Link>
    </div>
  );
}

export default async function SearchDetailPage({
  params,
  searchParams,
}: PageProps<"/search/[id]">) {
  const { id } = await params;
  const raw = (await searchParams) as SearchParams;

  const page = Math.max(1, Number(first(raw.page) ?? 1) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(first(raw.pageSize) ?? 50) || 50),
  );

  const filters = {
    page,
    pageSize,
    ...(first(raw.category) ? { category: first(raw.category) } : {}),
    ...(first(raw.minRating) ? { minRating: first(raw.minRating) } : {}),
    ...(first(raw.hasPhone) ? { hasPhone: first(raw.hasPhone) } : {}),
    ...(first(raw.hasWebsite) ? { hasWebsite: first(raw.hasWebsite) } : {}),
    ...(first(raw.search) ? { search: first(raw.search) } : {}),
    ...(first(raw.sortBy) ? { sortBy: first(raw.sortBy) } : {}),
    ...(first(raw.sortOrder) ? { sortOrder: first(raw.sortOrder) } : {}),
  };

  const paginationParams = Object.fromEntries(
    Object.entries(filters)
      .filter(([key]) => key !== "page" && key !== "pageSize")
      .map(([key, value]) => [key, String(value)]),
  );

  let detail: SearchDetail | null = null;
  let errorMessage: string | null = null;

  try {
    detail = await api.getSearch(id, filters);
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Beklenmeyen bir hata oluştu.";
  }

  if (!detail) {
    return (
      <>
        <BackLink />
        <PageHeader title="Araştırma sonuçları" />
        <ErrorState message={errorMessage ?? "Veri alınamadı."} />
      </>
    );
  }

  const { search, results } = detail;

  return (
    <>
      <BackLink />

      <PageHeader
        title={`${search.city} / ${search.district}`}
        description={`${getCountryName(search.country)} · ${search.keywords.join(", ")} · ${formatNumber(
          search.resultCount,
        )} sonuç · ${formatDateTime(search.createdAt)}`}
      >
        <Suspense fallback={null}>
          <ExportButtons resource="search" searchId={id} />
        </Suspense>
        <SearchStatusBadge status={search.status} />
      </PageHeader>

      {search.status === "FAILED" ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4"
        >
          <p className="text-sm font-semibold">Araştırma tamamlanamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Places isteği başarısız oldu. Lütfen tekrar deneyin.
          </p>
        </div>
      ) : null}

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <ResultsFilters categories={results.facets.categories} />
      </Suspense>

      <div className="mt-6">
        {results.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Sonuç bulunamadı"
            description={
              results.total === 0 && search.resultCount === 0
                ? "Bu arama için Google Places üzerinden işletme dönmedi. Farklı kelimeler deneyin."
                : "Seçilen filtrelere uyan işletme yok. Filtreleri temizleyip tekrar deneyin."
            }
          />
        ) : (
          <>
            <ResultsTable places={results.items} />
            <Pagination
              basePath={`/search/${id}`}
              params={paginationParams}
              page={results.page}
              totalPages={results.totalPages}
              total={results.total}
              pageSize={results.pageSize}
            />
          </>
        )}
      </div>
    </>
  );
}
