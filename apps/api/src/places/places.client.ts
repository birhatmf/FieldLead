import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GOOGLE_PLACES_BASE_URL,
  PLACE_DETAILS_FIELD_MASK,
  TEXT_SEARCH_FIELD_MASK,
} from './places.constants.js';
import type {
  GooglePlace,
  GoogleTextSearchResponse,
} from './places.types.js';

export interface TextSearchParams {
  textQuery: string;
  pageSize?: number;
  pageToken?: string;
  languageCode?: string;
  regionCode?: string;
}

interface RequestOptions {
  method: 'GET' | 'POST';
  fieldMask: string;
  body?: unknown;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

@Injectable()
export class PlacesClient {
  private readonly logger = new Logger(PlacesClient.name);
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('GOOGLE_MAPS_API_KEY');
    this.timeoutMs = Number(
      this.config.get<string>('GOOGLE_PLACES_TIMEOUT_MS') ?? 10_000,
    );
    this.maxAttempts = Number(
      this.config.get<string>('GOOGLE_PLACES_MAX_ATTEMPTS') ?? 3,
    );
  }

  searchText(params: TextSearchParams): Promise<GoogleTextSearchResponse> {
    return this.request<GoogleTextSearchResponse>(
      `${GOOGLE_PLACES_BASE_URL}/places:searchText`,
      {
        method: 'POST',
        fieldMask: TEXT_SEARCH_FIELD_MASK,
        body: {
          languageCode: 'tr',
          regionCode: 'TR',
          ...params,
        },
      },
    );
  }

  getPlaceDetails(placeId: string): Promise<GooglePlace> {
    return this.request<GooglePlace>(
      `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`,
      { method: 'GET', fieldMask: PLACE_DETAILS_FIELD_MASK },
    );
  }

  private async request<T>(url: string, options: RequestOptions): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.send<T>(url, options);
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === this.maxAttempts) {
          throw error;
        }

        const backoffMs = 2 ** (attempt - 1) * 500;
        this.logger.warn(
          `Google Places istegi basarisiz, ${backoffMs}ms sonra tekrar denenecek (deneme ${attempt}/${this.maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError;
  }

  private async send<T>(url: string, options: RequestOptions): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': options.fieldMask,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new HttpException(
        `Google Places API erisilemedi: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const payload = await this.parseBody(response);

    if (response.ok) {
      return payload as T;
    }

    const message = this.extractErrorMessage(payload);

    if (response.status === 400) {
      throw new HttpException(`Google Places istegi gecersiz: ${message}`, HttpStatus.BAD_REQUEST);
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpException(
        `Google Places API anahtari reddedildi: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    throw new HttpException(
      `Google Places API hatasi (${response.status}): ${message}`,
      response.status === 429 ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_GATEWAY,
    );
  }

  private async parseBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  private extractErrorMessage(payload: unknown): string {
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const error = (payload as { error?: { message?: string } }).error;
      return error?.message ?? 'bilinmeyen hata';
    }

    return 'bilinmeyen hata';
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof HttpException)) {
      return false;
    }

    return RETRYABLE_STATUS_CODES.has(error.getStatus());
  }
}
