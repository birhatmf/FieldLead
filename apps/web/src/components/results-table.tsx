"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { LeadStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api, ApiError } from "@/lib/api";
import { displayWebsite, formatNumber, formatRating } from "@/lib/format";
import type { SearchResultPlace } from "@/lib/types";

const CELL = "px-4 py-3 align-top";

export function ResultsTable({ places }: { places: SearchResultPlace[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allSelected = places.length > 0 && selected.size === places.length;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(places.map((place) => place.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async function saveAsLeads() {
    const placeIds = [...selected].filter(
      (id) => !places.find((place) => place.id === id)?.lead,
    );

    setSaving(true);

    try {
      const result = await api.createLeads({ placeIds });
      toast.success(`${formatNumber(result.created)} lead oluşturuldu`, {
        description:
          result.skipped > 0
            ? `${formatNumber(result.skipped)} işletme zaten lead olarak kayıtlıydı.`
            : undefined,
      });
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      toast.error("Lead oluşturulamadı", {
        description:
          error instanceof ApiError ? error.message : "Beklenmeyen bir hata.",
      });
    } finally {
      setSaving(false);
    }
  }

  const alreadyLeadCount = [...selected].filter(
    (id) => places.find((place) => place.id === id)?.lead,
  ).length;
  const selectableCount = selected.size - alreadyLeadCount;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary px-4 py-3">
          <p aria-live="polite" className="text-sm font-medium">
            {formatNumber(selected.size)} işletme seçildi
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Seçimi temizle
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || selectableCount === 0}
              onClick={saveAsLeads}
            >
              {saving ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <UserPlus aria-hidden="true" className="size-4" />
              )}
              Lead olarak kaydet
              {selectableCount > 0 ? ` (${formatNumber(selectableCount)})` : ""}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <caption className="sr-only">
            Arama sonucu işletmeler; seçip lead olarak kaydedebilirsiniz.
          </caption>
          <thead className="bg-secondary text-left">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Tüm işletmeleri seç"
                />
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                İşletme
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Telefon
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                E-posta
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                İlçe
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Puan
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Yorum
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Web
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Lead
              </th>
              <th scope="col" className="w-12 px-4 py-3">
                <span className="sr-only">Detay</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {places.map((place) => {
              const isExpanded = expanded === place.id;

              return (
                <Fragment key={place.id}>
                  <tr className="transition-colors duration-200 hover:bg-secondary/60">
                    <td className={CELL}>
                      <Checkbox
                        checked={selected.has(place.id)}
                        onCheckedChange={(checked) =>
                          toggleOne(place.id, checked === true)
                        }
                        aria-label={`${place.name} işletmesini seç`}
                      />
                    </td>
                    <td className={CELL}>
                      <p className="font-medium">{place.name}</p>
                      {place.category ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {place.category}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {place.phone ? (
                        <a
                          href={`tel:${place.phone.replace(/\s/g, "")}`}
                          className="cursor-pointer text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          {place.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {place.email ? (
                        <a
                          href={`mailto:${place.email}`}
                          className="inline-flex max-w-[200px] cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                          <span className="truncate">{place.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {place.district ?? "—"}
                    </td>
                    <td className={`${CELL} text-right tabular-nums`}>
                      {place.rating === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Star
                            aria-hidden="true"
                            className="size-3.5 fill-amber-500 text-amber-500"
                          />
                          {formatRating(place.rating)}
                        </span>
                      )}
                    </td>
                    <td className={`${CELL} text-right tabular-nums`}>
                      {formatNumber(place.userRatingCount)}
                    </td>
                    <td className={CELL}>
                      {place.website ? (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[180px] cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <Globe
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                          <span className="truncate">
                            {displayWebsite(place.website)}
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={CELL}>
                      {place.lead ? (
                        <LeadStatusBadge status={place.lead.status} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={CELL}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-expanded={isExpanded}
                        aria-controls={`detay-${place.id}`}
                        aria-label={`${place.name} detayını ${isExpanded ? "kapat" : "aç"}`}
                        onClick={() =>
                          setExpanded(isExpanded ? null : place.id)
                        }
                      >
                        <ChevronDown
                          aria-hidden="true"
                          className={`size-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr id={`detay-${place.id}`}>
                      <td colSpan={10} className="bg-secondary/50 px-4 py-4">
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-muted-foreground">
                              Adres
                            </dt>
                            <dd className="mt-1 flex items-start gap-1.5 text-sm">
                              <MapPin
                                aria-hidden="true"
                                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                              />
                              {place.formattedAddress ?? "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                              Eşleşen kelimeler
                            </dt>
                            <dd className="mt-1 text-sm">
                              {place.matchedKeywords.join(", ") || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                              Koordinat
                            </dt>
                            <dd className="mt-1 text-sm tabular-nums">
                              {place.latitude !== null &&
                              place.longitude !== null
                                ? `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {place.googleMapsUrl ? (
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={place.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                Google Maps&apos;te aç
                              </a>
                            </Button>
                          ) : null}
                          {place.phone ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={`tel:${place.phone.replace(/\s/g, "")}`}>
                                <Phone aria-hidden="true" className="size-4" />
                                {place.phone}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
