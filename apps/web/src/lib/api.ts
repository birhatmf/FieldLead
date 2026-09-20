import type {
  CreateLeadResponse,
  Lead,
  LeadStatus,
  Paginated,
  SearchDetail,
  SearchSummary,
  StatsOverview,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | undefined | null;

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "API sunucusuna ulaşılamadı. Çalıştığından emin olun.",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    return message ?? `İstek başarısız (${response.status})`;
  } catch {
    return `İstek başarısız (${response.status})`;
  }
}

export const api = {
  stats: () => request<StatsOverview>("/stats/overview"),

  listSearches: (params: { page?: number; pageSize?: number }) =>
    request<Paginated<SearchSummary>>(`/searches${buildQuery(params)}`),

  getSearch: (
    id: string,
    params: Record<string, QueryValue> = {},
  ) => request<SearchDetail>(`/searches/${id}${buildQuery(params)}`),

  createSearch: (body: {
    country: string;
    city: string;
    district: string;
    keywords: string[];
    enrichEmails?: boolean;
  }) =>
    request<SearchSummary>("/searches", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteSearch: (id: string) =>
    request<void>(`/searches/${id}`, { method: "DELETE" }),

  listLeads: (params: Record<string, QueryValue> = {}) =>
    request<Paginated<Lead>>(`/leads${buildQuery(params)}`),

  createLeads: (body: { placeIds: string[]; notes?: string }) =>
    request<CreateLeadResponse>("/leads", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLead: (
    id: string,
    body: { status?: LeadStatus; notes?: string | null },
  ) =>
    request<Lead>(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteLead: (id: string) =>
    request<void>(`/leads/${id}`, { method: "DELETE" }),
};
