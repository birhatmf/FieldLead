import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchStatus } from '@fieldlead/database';
import { getCountry } from '../common/countries.js';
import type { NormalizedPlace } from '../places/places.types.js';
import { PlacesService } from '../places/places.service.js';
import { EmailExtractorService } from '../enrichment/email-extractor.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapWithConcurrency } from '../common/concurrency.js';
import type {
  CreateSearchDto,
  SearchListQueryDto,
  SearchResultsQueryDto,
} from './dto/create-search.dto.js';

const SORTABLE_FIELDS = new Set([
  'name',
  'rating',
  'userRatingCount',
  'createdAt',
]);

interface MergedPlace {
  place: NormalizedPlace;
  keywords: Set<string>;
}

@Injectable()
export class SearchesService {
  private readonly logger = new Logger(SearchesService.name);
  private readonly maxKeywords: number;
  private readonly maxConcurrency: number;
  private readonly emailEnrichmentEnabled: boolean;
  private readonly emailConcurrency: number;
  private readonly maxEmailSites: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlacesService,
    private readonly emailExtractor: EmailExtractorService,
    private readonly config: ConfigService,
  ) {
    this.maxKeywords = Number(
      this.config.get<string>('SEARCH_MAX_KEYWORDS') ?? 20,
    );
    this.maxConcurrency = Number(
      this.config.get<string>('SEARCH_MAX_CONCURRENT_KEYWORDS') ?? 3,
    );
    this.emailEnrichmentEnabled =
      this.config.get<string>('EMAIL_ENRICHMENT_ENABLED') !== 'false';
    this.emailConcurrency = Number(
      this.config.get<string>('EMAIL_MAX_CONCURRENT') ?? 5,
    );
    this.maxEmailSites = Number(
      this.config.get<string>('EMAIL_MAX_SITES_PER_SEARCH') ?? 50,
    );
  }

  async create(dto: CreateSearchDto) {
    const keywords = this.normalizeKeywords(dto.keywords);

    if (keywords.length === 0) {
      throw new BadRequestException('En az bir anahtar kelime gerekli.');
    }

    if (keywords.length > this.maxKeywords) {
      throw new BadRequestException(
        `En fazla ${this.maxKeywords} anahtar kelime kullanilabilir.`,
      );
    }

    const search = await this.prisma.search.create({
      data: {
        country: dto.country,
        city: dto.city.trim(),
        district: dto.district.trim(),
        keywords,
        status: SearchStatus.RUNNING,
      },
    });

    try {
      const merged = await this.collectPlaces(keywords, dto, search.id);
      await this.enrichEmails(merged, dto.enrichEmails);
      await this.persistResults(search.id, merged);

      return await this.prisma.search.update({
        where: { id: search.id },
        data: {
          status: SearchStatus.COMPLETED,
          resultCount: merged.size,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.search.update({
        where: { id: search.id },
        data: { status: SearchStatus.FAILED, completedAt: new Date() },
      });

      this.logger.error(
        `Arama basarisiz (${search.id})`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async findAll(query: SearchListQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const where = query.status ? { status: query.status as SearchStatus } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.search.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.search.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findOne(id: string, query: SearchResultsQueryDto) {
    const search = await this.prisma.search.findUnique({ where: { id } });

    if (!search) {
      throw new NotFoundException(`Arama bulunamadi: ${id}`);
    }

    const results = await this.findResults(id, query);

    return { search, results };
  }

  async remove(id: string): Promise<void> {
    const search = await this.prisma.search.findUnique({ where: { id } });

    if (!search) {
      throw new NotFoundException(`Arama bulunamadi: ${id}`);
    }

    await this.prisma.search.delete({ where: { id } });
  }

  private async findResults(id: string, query: SearchResultsQueryDto) {
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;
    const sortBy = SORTABLE_FIELDS.has(query.sortBy)
      ? query.sortBy
      : 'userRatingCount';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {
      searchId: id,
      place: {
        ...(query.category ? { category: query.category } : {}),
        ...(query.minRating !== undefined
          ? { rating: { gte: query.minRating } }
          : {}),
        ...(query.minReviewCount !== undefined
          ? { userRatingCount: { gte: query.minReviewCount } }
          : {}),
        ...(query.hasPhone === true ? { phone: { not: null } } : {}),
        ...(query.hasPhone === false ? { phone: null } : {}),
        ...(query.hasWebsite === true ? { website: { not: null } } : {}),
        ...(query.hasWebsite === false ? { website: null } : {}),
        ...(query.hasEmail === true ? { email: { not: null } } : {}),
        ...(query.hasEmail === false ? { email: null } : {}),
        ...(query.search
          ? { name: { contains: query.search, mode: 'insensitive' as const } }
          : {}),
      },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.searchResult.findMany({
        where,
        include: {
          place: {
            include: {
              leads: { select: { id: true, status: true }, take: 1 },
            },
          },
        },
        orderBy: { place: { [sortBy]: sortOrder } },
        skip,
        take: pageSize,
      }),
      this.prisma.searchResult.count({ where }),
    ]);

    const categories = await this.findCategories(id);

    return {
      items: rows.map((row) => ({
        ...row.place,
        matchedKeywords: row.keywords,
        lead: row.place.leads[0] ?? null,
      })),
      facets: { categories },
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private async findCategories(searchId: string): Promise<string[]> {
    const places = await this.prisma.place.findMany({
      where: {
        category: { not: null },
        results: { some: { searchId } },
      },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    return places
      .map((place) => place.category)
      .filter((category): category is string => category !== null);
  }

  private normalizeKeywords(keywords: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const keyword of keywords) {
      const value = keyword.trim().replace(/\s+/g, ' ');
      const key = value.toLocaleLowerCase('tr-TR');

      if (!value || seen.has(key)) {
        continue;
      }

      seen.add(key);
      normalized.push(value);
    }

    return normalized;
  }

  private async collectPlaces(
    keywords: string[],
    dto: CreateSearchDto,
    searchId: string,
  ): Promise<Map<string, MergedPlace>> {
    const merged = new Map<string, MergedPlace>();
    const country = getCountry(dto.country);

    const perKeyword = await mapWithConcurrency(
      keywords,
      Math.max(1, this.maxConcurrency),
      async (keyword) => {
        const query = this.places.buildQuery(
          keyword,
          dto.district.trim(),
          dto.city.trim(),
          country.name,
        );
        const found = await this.places.searchPlaces(query, {
          maxPages: dto.maxPages,
          searchId,
          regionCode: country.regionCode,
        });

        return { keyword, found };
      },
    );

    for (const { keyword, found } of perKeyword) {
      for (const place of found) {
        const existing = merged.get(place.googlePlaceId);

        if (existing) {
          existing.keywords.add(keyword);
          continue;
        }

        merged.set(place.googlePlaceId, {
          place,
          keywords: new Set([keyword]),
        });
      }
    }

    return merged;
  }

  /**
   * Google Places e-posta dondurmedigi icin, web sitesi olan isletmelerin
   * iletisim sayfalarindan e-posta cikarilir. Daha once bulunmus adresler
   * veritabanindan tekrar kullanilir; boylece ayni site tekrar cekilmez.
   */
  private async enrichEmails(
    merged: Map<string, MergedPlace>,
    requested: boolean | undefined,
  ): Promise<void> {
    if (requested === false || !this.emailEnrichmentEnabled) {
      return;
    }

    const candidates = [...merged.values()].filter(
      (entry) => entry.place.website && !entry.place.email,
    );

    if (candidates.length === 0) {
      return;
    }

    const known = await this.prisma.place.findMany({
      where: {
        googlePlaceId: {
          in: candidates.map((entry) => entry.place.googlePlaceId),
        },
        email: { not: null },
      },
      select: { googlePlaceId: true, email: true },
    });

    const knownEmails = new Map(
      known.map((place) => [place.googlePlaceId, place.email as string]),
    );
    const pending: MergedPlace[] = [];

    for (const entry of candidates) {
      const cached = knownEmails.get(entry.place.googlePlaceId);

      if (cached) {
        entry.place.email = cached;
        continue;
      }

      pending.push(entry);
    }

    const limited = pending.slice(0, Math.max(0, this.maxEmailSites));

    if (limited.length === 0) {
      return;
    }

    let found = 0;

    await mapWithConcurrency(
      limited,
      Math.max(1, this.emailConcurrency),
      async (entry) => {
        const result = await this.emailExtractor.extractFromWebsite(
          entry.place.website as string,
        );

        if (result) {
          entry.place.email = result.email;
          found += 1;
        }

        return null;
      },
    );

    this.logger.log(
      `${limited.length} web sitesi tarandi, ${found} e-posta bulundu`,
    );
  }

  private async persistResults(
    searchId: string,
    merged: Map<string, MergedPlace>,
  ): Promise<void> {
    const placeIdByGoogleId = new Map<string, string>();

    for (const entry of merged.values()) {
      const { googlePlaceId, ...rest } = entry.place;

      const saved = await this.prisma.place.upsert({
        where: { googlePlaceId },
        create: { googlePlaceId, ...rest },
        update: rest,
      });

      placeIdByGoogleId.set(googlePlaceId, saved.id);
    }

    if (merged.size === 0) {
      return;
    }

    await this.prisma.searchResult.createMany({
      data: [...merged.values()].map((entry) => ({
        searchId,
        placeId: placeIdByGoogleId.get(entry.place.googlePlaceId) as string,
        keywords: [...entry.keywords],
      })),
      skipDuplicates: true,
    });
  }
}
