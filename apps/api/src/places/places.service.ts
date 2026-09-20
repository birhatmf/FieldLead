import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  API_OPERATIONS,
  API_PROVIDERS,
  ApiUsageService,
} from '../api-usage/api-usage.service.js';
import { PlacesClient } from './places.client.js';
import {
  ADDRESS_COMPONENT_CITY,
  ADDRESS_COMPONENT_COUNTRY,
  ADDRESS_COMPONENT_DISTRICT,
} from './places.constants.js';
import type {
  GoogleAddressComponent,
  GooglePlace,
  NormalizedPlace,
} from './places.types.js';

const GOOGLE_MAX_PAGE_SIZE = 20;

export interface SearchPlacesOptions {
  maxPages?: number;
  pageSize?: number;
  searchId?: string | null;
  regionCode?: string;
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly defaultMaxPages: number;

  constructor(
    private readonly client: PlacesClient,
    private readonly apiUsage: ApiUsageService,
    private readonly config: ConfigService,
  ) {
    this.defaultMaxPages = Number(
      this.config.get<string>('PLACES_MAX_PAGES_PER_KEYWORD') ?? 3,
    );
  }

  buildQuery(
    keyword: string,
    district: string,
    city: string,
    countryName?: string,
  ): string {
    return [keyword, district, city, countryName].filter(Boolean).join(', ');
  }

  async searchPlaces(
    query: string,
    options: SearchPlacesOptions = {},
  ): Promise<NormalizedPlace[]> {
    const maxPages = Math.min(
      Math.max(options.maxPages ?? this.defaultMaxPages, 1),
      this.defaultMaxPages,
    );
    const pageSize = Math.min(
      Math.max(options.pageSize ?? GOOGLE_MAX_PAGE_SIZE, 1),
      GOOGLE_MAX_PAGE_SIZE,
    );

    const collected = new Map<string, NormalizedPlace>();
    let pageToken: string | undefined;

    for (let page = 0; page < maxPages; page += 1) {
      const response = await this.client.searchText({
        textQuery: query,
        pageSize,
        pageToken,
        ...(options.regionCode ? { regionCode: options.regionCode } : {}),
      });

      await this.apiUsage.record({
        provider: API_PROVIDERS.GOOGLE_PLACES,
        operation: API_OPERATIONS.TEXT_SEARCH,
        searchId: options.searchId ?? null,
      });

      for (const raw of response.places ?? []) {
        const place = this.normalizePlace(raw);
        collected.set(place.googlePlaceId, place);
      }

      pageToken = response.nextPageToken;

      if (!pageToken) {
        break;
      }
    }

    return [...collected.values()];
  }

  async getPlaceDetails(googlePlaceId: string): Promise<NormalizedPlace> {
    let raw: GooglePlace;

    try {
      raw = await this.client.getPlaceDetails(googlePlaceId);
    } finally {
      await this.apiUsage.record({
        provider: API_PROVIDERS.GOOGLE_PLACES,
        operation: API_OPERATIONS.PLACE_DETAILS,
      });
    }

    if (!raw.id) {
      throw new NotFoundException(`Isletme bulunamadi: ${googlePlaceId}`);
    }

    return this.normalizePlace(raw);
  }

  normalizePlace(raw: GooglePlace): NormalizedPlace {
    const components = raw.addressComponents ?? [];

    return {
      googlePlaceId: raw.id,
      name: raw.displayName?.text ?? 'Isimsiz isletme',
      category: raw.primaryTypeDisplayName?.text ?? raw.primaryType ?? null,
      formattedAddress: raw.formattedAddress ?? null,
      phone: raw.nationalPhoneNumber ?? raw.internationalPhoneNumber ?? null,
      // Google Places API e-posta dondurmez; web sitesinden ayrica cikarilir.
      email: null,
      website: raw.websiteUri ?? null,
      googleMapsUrl: raw.googleMapsUri ?? null,
      rating: raw.rating ?? null,
      userRatingCount: raw.userRatingCount ?? null,
      latitude: raw.location?.latitude ?? null,
      longitude: raw.location?.longitude ?? null,
      city: this.findComponent(components, ADDRESS_COMPONENT_CITY),
      district: this.findComponent(components, ADDRESS_COMPONENT_DISTRICT),
      country: this.findCountryCode(components, ADDRESS_COMPONENT_COUNTRY),
      types: raw.types ?? [],
    };
  }

  private findComponent(
    components: GoogleAddressComponent[],
    type: string,
  ): string | null {
    const match = components.find((component) =>
      component.types?.includes(type),
    );

    return match?.longText ?? match?.shortText ?? null;
  }

  /**
   * Google ulke bileseninde shortText ISO 3166-1 alpha-2 kodunu tasir
   * (orn. "TR"); kod yoksa uzun ada dusulur.
   */
  private findCountryCode(
    components: GoogleAddressComponent[],
    type: string,
  ): string | null {
    const match = components.find((component) =>
      component.types?.includes(type),
    );

    if (!match) {
      return null;
    }

    const shortText = match.shortText?.trim();

    if (shortText && /^[A-Za-z]{2}$/.test(shortText)) {
      return shortText.toUpperCase();
    }

    return match.longText ?? null;
  }
}
