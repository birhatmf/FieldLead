import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchForm } from "@/components/search-form";
import { EmptyState, ErrorState } from "@/components/states";
import { SearchStatusBadge } from "@/components/status-badge";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getCountryName } from "@/lib/locations";
import type { Paginated, SearchSummary } from "@/lib/types";

export const metadata = { title: "Araştırma" };

export default async function SearchPage() {
  let recent: Paginated<SearchSummary> | null = null;
  let errorMessage: string | null = null;

  try {
    recent = await api.listSearches({ page: 1, pageSize: 10 });
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Beklenmeyen bir hata oluştu.";
  }

  return (
    <>
      <PageHeader
        title="Yeni araştırma"
        description="Bölge ve anahtar kelimeleri seçin; işletmeler Google Places üzerinden bulunur."
      />

      <SearchForm />

      <section aria-labelledby="gecmis" className="mt-8">
        <h2 id="gecmis" className="text-base font-semibold">
          Son araştırmalar
        </h2>

        {!recent ? (
          <div className="mt-4">
            <ErrorState message={errorMessage ?? "Veri alınamadı."} />
          </div>
        ) : recent.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={SearchX}
              title="Henüz araştırma yok"
              description="İlk araştırmanızı yukarıdaki formdan başlatabilirsiniz."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Son araştırmalar listesi</caption>
                <thead className="bg-secondary text-left">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Ülke
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Bölge
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Anahtar kelimeler
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Durum
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Sonuç
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.items.map((search) => (
                    <tr
                      key={search.id}
                      className="transition-colors duration-200 hover:bg-secondary/60"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getCountryName(search.country)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/search/${search.id}`}
                          className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          {search.city} / {search.district}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {search.keywords.join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <SearchStatusBadge status={search.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(search.resultCount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(search.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
