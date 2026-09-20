export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "QUOTE_SENT"
  | "CUSTOMER"
  | "NOT_INTERESTED";

export type SearchStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface SearchSummary {
  id: string;
  country: string;
  city: string;
  district: string;
  keywords: string[];
  status: SearchStatus;
  resultCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface LeadRef {
  id: string;
  status: LeadStatus;
}

export interface PlaceRecord {
  id: string;
  googlePlaceId: string;
  name: string;
  category: string | null;
  formattedAddress: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  userRatingCount: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  district: string | null;
  country: string | null;
  types: string[];
}

export interface SearchResultPlace extends PlaceRecord {
  matchedKeywords: string[];
  lead: LeadRef | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResultsPage extends Paginated<SearchResultPlace> {
  facets: { categories: string[] };
}

export interface SearchDetail {
  search: SearchSummary;
  results: SearchResultsPage;
}

export interface Lead {
  id: string;
  placeId: string;
  status: LeadStatus;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  place: PlaceRecord;
  assignee?: { id: string; name: string } | null;
}

export interface UsageSummaryItem {
  provider: string;
  operation: string;
  requestCount: number;
  estimatedCost: number;
}

export interface StatsOverview {
  places: { total: number };
  leads: { total: number; byStatus: Record<string, number> };
  searches: { total: number; recent: SearchSummary[] };
  apiUsage: {
    periodStart: string;
    periodEnd: string;
    totalRequests: number;
    estimatedCost: number;
    items: UsageSummaryItem[];
  };
}

export interface CreateLeadResponse {
  requested: number;
  created: number;
  skipped: number;
  items: Lead[];
}
