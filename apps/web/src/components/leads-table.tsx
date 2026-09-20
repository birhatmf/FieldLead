"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "@/lib/constants";
import { displayWebsite, formatDate, formatNumber, formatRating } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";

const CELL = "px-4 py-3 align-top";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function updateLead(
    lead: Lead,
    payload: { status?: LeadStatus; notes?: string | null },
    successMessage: string,
  ) {
    setPendingId(lead.id);

    try {
      await api.updateLead(lead.id, payload);
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error("Lead güncellenemedi", {
        description:
          error instanceof ApiError ? error.message : "Beklenmeyen bir hata.",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function removeLead(lead: Lead) {
    setPendingId(lead.id);

    try {
      await api.deleteLead(lead.id);
      toast.success("Lead silindi");
      router.refresh();
    } catch (error) {
      toast.error("Lead silinemedi", {
        description:
          error instanceof ApiError ? error.message : "Beklenmeyen bir hata.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <caption className="sr-only">Lead listesi</caption>
          <thead className="bg-secondary text-left">
            <tr>
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
                Web
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Puan
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Durum
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Tarih
              </th>
              <th scope="col" className="w-24 px-4 py-3">
                <span className="sr-only">İşlemler</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => {
              const isExpanded = expanded === lead.id;
              const isPending = pendingId === lead.id;

              return (
                <Fragment key={lead.id}>
                  <tr className="transition-colors duration-200 hover:bg-secondary/60">
                    <td className={CELL}>
                      <p className="font-medium">{lead.place.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[lead.place.category, lead.place.district]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {lead.place.phone ? (
                        <a
                          href={`tel:${lead.place.phone.replace(/\s/g, "")}`}
                          className="cursor-pointer text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          {lead.place.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {lead.place.email ? (
                        <a
                          href={`mailto:${lead.place.email}`}
                          className="inline-flex max-w-[200px] cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <Mail
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                          <span className="truncate">{lead.place.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={CELL}>
                      {lead.place.website ? (
                        <a
                          href={lead.place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[180px] cursor-pointer items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="truncate">
                            {displayWebsite(lead.place.website)}
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${CELL} text-right tabular-nums`}>
                      {formatRating(lead.place.rating)}
                    </td>
                    <td className={CELL}>
                      <Select
                        value={lead.status}
                        disabled={isPending}
                        onValueChange={(value) =>
                          updateLead(
                            lead,
                            { status: value as LeadStatus },
                            "Durum güncellendi",
                          )
                        }
                      >
                        <SelectTrigger
                          className="h-9 w-44"
                          aria-label={`${lead.place.name} durumu`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUS_ORDER.map((status) => (
                            <SelectItem key={status} value={status}>
                              {LEAD_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className={`${CELL} text-muted-foreground`}>
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className={`${CELL} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-expanded={isExpanded}
                          aria-controls={`lead-${lead.id}`}
                          aria-label={`${lead.place.name} notlarını ${isExpanded ? "kapat" : "aç"}`}
                          onClick={() =>
                            setExpanded(isExpanded ? null : lead.id)
                          }
                        >
                          <ChevronDown
                            aria-hidden="true"
                            className={`size-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          aria-label={`${lead.place.name} leadini sil`}
                          onClick={() => removeLead(lead)}
                        >
                          {isPending ? (
                            <Loader2
                              aria-hidden="true"
                              className="size-4 animate-spin"
                            />
                          ) : (
                            <Trash2
                              aria-hidden="true"
                              className="size-4 text-destructive"
                            />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr id={`lead-${lead.id}`}>
                      <td colSpan={8} className="bg-secondary/50 px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Adres
                            </p>
                            <p className="mt-1 text-sm">
                              {lead.place.formattedAddress ?? "—"}
                            </p>
                            <p className="mt-3 text-xs font-medium text-muted-foreground">
                              Google puanı / yorum
                            </p>
                            <p className="mt-1 text-sm tabular-nums">
                              {formatRating(lead.place.rating)} ·{" "}
                              {formatNumber(lead.place.userRatingCount)} yorum
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`notes-${lead.id}`}>Notlar</Label>
                            <Textarea
                              id={`notes-${lead.id}`}
                              rows={3}
                              value={notes[lead.id] ?? lead.notes ?? ""}
                              onChange={(event) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [lead.id]: event.target.value,
                                }))
                              }
                              placeholder="Görüşme notları…"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                updateLead(
                                  lead,
                                  { notes: notes[lead.id] ?? lead.notes ?? "" },
                                  "Notlar kaydedildi",
                                )
                              }
                            >
                              {isPending ? (
                                <Loader2
                                  aria-hidden="true"
                                  className="size-4 animate-spin"
                                />
                              ) : null}
                              Notu kaydet
                            </Button>
                          </div>
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
