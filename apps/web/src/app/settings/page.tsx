import { Info, KeyRound, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ErrorState } from "@/components/states";
import { api, ApiError, API_URL } from "@/lib/api";
import { formatCurrencyUsd, formatDate, formatNumber } from "@/lib/format";
import type { StatsOverview } from "@/lib/types";

export const metadata = { title: "Ayarlar" };

const OPERATION_LABELS: Record<string, string> = {
  TEXT_SEARCH: "Metin araması",
  PLACE_DETAILS: "İşletme detayı",
};

export default async function SettingsPage() {
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
        <PageHeader title="Ayarlar" />
        <ErrorState message={errorMessage ?? "Veri alınamadı."} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Sistem durumu ve Google Places API kullanımı."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Bu ay API çağrısı"
          value={formatNumber(stats.apiUsage.totalRequests)}
          hint={`${formatDate(stats.apiUsage.periodStart)} – ${formatDate(
            stats.apiUsage.periodEnd,
          )}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Tahmini maliyet"
          value={formatCurrencyUsd(stats.apiUsage.estimatedCost)}
          hint="Google Places fiyatlandırmasına göre"
        />
        <StatCard
          label="Toplam işletme"
          value={formatNumber(stats.places.total)}
          hint={`${formatNumber(stats.searches.total)} arama`}
        />
      </div>

      <section
        aria-labelledby="kullanim"
        className="mt-6 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 id="kullanim" className="text-base font-semibold">
            Kullanım dökümü
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            İşlem bazında bu ayın toplamları.
          </p>
        </div>

        {stats.apiUsage.items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Bu ay henüz Google Places çağrısı yapılmadı.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">API kullanım dökümü</caption>
              <thead className="bg-secondary text-left">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Sağlayıcı
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    İşlem
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Çağrı
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Tahmini maliyet
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.apiUsage.items.map((item) => (
                  <tr key={`${item.provider}-${item.operation}`}>
                    <td className="px-5 py-3">{item.provider}</td>
                    <td className="px-5 py-3">
                      {OPERATION_LABELS[item.operation] ?? item.operation}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatNumber(item.requestCount)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatCurrencyUsd(item.estimatedCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="fiyatlandirma"
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2
            id="fiyatlandirma"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Info aria-hidden="true" className="size-4 text-primary" />
            Fiyatlandırma
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Google fiyatlandırması zamanla değişebildiği için tutarlar kodda
            sabit değildir; ortam değişkenleriyle güncellenir. Tahmini maliyet,
            çağrı sayısı ile birim fiyatın çarpımıdır.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-mono text-xs text-muted-foreground">
                GOOGLE_PLACES_PRICE_TEXT_SEARCH
              </dt>
              <dd className="mt-0.5">1000 istek başına USD</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground">
                GOOGLE_PLACES_PRICE_PLACE_DETAILS
              </dt>
              <dd className="mt-0.5">1000 istek başına USD</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="sistem"
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2
            id="sistem"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <KeyRound aria-hidden="true" className="size-4 text-primary" />
            Sistem
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">API adresi</dt>
              <dd className="mt-0.5 font-mono text-xs break-all">{API_URL}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Google API anahtarı</dt>
              <dd className="mt-0.5">
                Yalnızca backend üzerinde kullanılır; tarayıcıya gönderilmez.
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-secondary px-4 py-3 text-xs text-muted-foreground">
            Kullanıcı yönetimi ve roller (ADMIN / MANAGER / SALESPERSON) sonraki
            fazda eklenecektir.
          </p>
        </section>
      </div>
    </>
  );
}
