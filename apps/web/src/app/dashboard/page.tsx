import Link from "next/link";
import { Building2, DollarSign, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ErrorState } from "@/components/states";
import { SearchStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants";
import { formatCurrencyUsd, formatDate, formatNumber } from "@/lib/format";
import { getCountryName } from "@/lib/locations";
import type { StatsOverview } from "@/lib/types";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  let stats: StatsOverview | null = null;
  let errorMessage: string | null = null;

  try {
    stats = await api.stats();
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Beklenmeyen bir hata oluştu.";
  }

  if (!stats) {
    return (
      <>
        <PageHeader title="Panel" />
        <ErrorState message={errorMessage ?? "Veri alınamadı."} />
      </>
    );
  }

  const maxStatusCount = Math.max(1, ...Object.values(stats.leads.byStatus));

  return (
    <>
      <PageHeader
        title="Panel"
        description="Araştırma ve lead durumunun özeti."
      >
        <Button asChild>
          <Link href="/search">Yeni araştırma</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam işletme"
          value={formatNumber(stats.places.total)}
          hint="Tekilleştirilmiş kayıtlar"
          icon={Building2}
        />
        <StatCard
          label="Toplam lead"
          value={formatNumber(stats.leads.total)}
          hint={`${formatNumber(stats.searches.total)} arama yapıldı`}
          icon={Users}
        />
        <StatCard
          label="Bu ay API çağrısı"
          value={formatNumber(stats.apiUsage.totalRequests)}
          hint="Google Places"
          icon={Search}
        />
        <StatCard
          label="Tahmini maliyet"
          value={formatCurrencyUsd(stats.apiUsage.estimatedCost)}
          hint="Bu ay"
          icon={DollarSign}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="lead-dagilimi"
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 id="lead-dagilimi" className="text-base font-semibold">
            Lead dağılımı
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Durum bazında lead sayıları.
          </p>

          <ul className="mt-5 space-y-3">
            {LEAD_STATUS_ORDER.map((status) => {
              const count = stats.leads.byStatus[status] ?? 0;

              return (
                <li key={status} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-sm text-muted-foreground">
                    {LEAD_STATUS_LABELS[status]}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.round((count / maxStatusCount) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
                    {formatNumber(count)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="son-arastirmalar"
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="son-arastirmalar" className="text-base font-semibold">
                Son araştırmalar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                En son çalıştırılan aramalar.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Tümü</Link>
            </Button>
          </div>

          {stats.searches.recent.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Henüz araştırma yapılmadı.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {stats.searches.recent.map((search) => (
                <li key={search.id}>
                  <Link
                    href={`/search/${search.id}`}
                    className="flex cursor-pointer flex-col gap-1 py-3 transition-colors duration-200 hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {getCountryName(search.country)} · {search.city} /{" "}
                        {search.district}
                      </span>
                      <SearchStatusBadge status={search.status} />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {search.keywords.join(", ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(search.resultCount)} sonuç ·{" "}
                      {formatDate(search.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
