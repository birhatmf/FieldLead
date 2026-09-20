import type { LeadStatus, SearchStatus } from "./types";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  INTERESTED: "İlgileniyor",
  QUOTE_SENT: "Teklif gönderildi",
  CUSTOMER: "Müşteri",
  NOT_INTERESTED: "İlgilenmiyor",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "QUOTE_SENT",
  "CUSTOMER",
  "NOT_INTERESTED",
];

export const SEARCH_STATUS_LABELS: Record<SearchStatus, string> = {
  PENDING: "Bekliyor",
  RUNNING: "Aranıyor",
  COMPLETED: "Tamamlandı",
  FAILED: "Başarısız",
};
