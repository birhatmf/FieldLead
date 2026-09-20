import { getCountryName } from '../common/countries.js';

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Yeni',
  CONTACTED: 'İletişime geçildi',
  INTERESTED: 'İlgileniyor',
  QUOTE_SENT: 'Teklif gönderildi',
  CUSTOMER: 'Müşteri',
  NOT_INTERESTED: 'İlgilenmiyor',
};

export interface ExportPlace {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  formattedAddress: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ExportLead {
  status: string;
  notes: string | null;
  createdAt: Date;
  assignee?: { name: string } | null;
}

export interface ExportRow {
  place: ExportPlace;
  lead?: ExportLead | null;
  matchedKeywords?: string[];
}

export interface ExportColumn {
  header: string;
  width: number;
  value: (row: ExportRow) => string | number | null | undefined;
}

const formatDate = (value: Date | null | undefined): string =>
  value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(value) : '';

export const EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'İşletme', width: 34, value: (row) => row.place.name },
  { header: 'Kategori', width: 22, value: (row) => row.place.category },
  { header: 'Telefon', width: 18, value: (row) => row.place.phone },
  { header: 'E-posta', width: 28, value: (row) => row.place.email },
  { header: 'Website', width: 32, value: (row) => row.place.website },
  { header: 'Adres', width: 46, value: (row) => row.place.formattedAddress },
  { header: 'İl', width: 14, value: (row) => row.place.city },
  { header: 'İlçe', width: 16, value: (row) => row.place.district },
  {
    header: 'Ülke',
    width: 14,
    value: (row) => getCountryName(row.place.country),
  },
  {
    header: 'Google Puanı',
    width: 14,
    value: (row) => row.place.rating,
  },
  {
    header: 'Yorum Sayısı',
    width: 14,
    value: (row) => row.place.userRatingCount,
  },
  {
    header: 'Google Maps',
    width: 44,
    value: (row) => row.place.googleMapsUrl,
  },
  { header: 'Enlem', width: 12, value: (row) => row.place.latitude },
  { header: 'Boylam', width: 12, value: (row) => row.place.longitude },
  {
    header: 'Eşleşen Kelimeler',
    width: 24,
    value: (row) => row.matchedKeywords?.join(', ') ?? '',
  },
  {
    header: 'Lead Durumu',
    width: 18,
    value: (row) =>
      row.lead ? (LEAD_STATUS_LABELS[row.lead.status] ?? row.lead.status) : '',
  },
  {
    header: 'Atanan',
    width: 20,
    value: (row) => row.lead?.assignee?.name ?? '',
  },
  { header: 'Notlar', width: 36, value: (row) => row.lead?.notes ?? '' },
  {
    header: 'Lead Tarihi',
    width: 14,
    value: (row) => formatDate(row.lead?.createdAt),
  },
];
