import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

export const API_PROVIDERS = {
  GOOGLE_PLACES: 'GOOGLE_PLACES',
} as const;

export const API_OPERATIONS = {
  TEXT_SEARCH: 'TEXT_SEARCH',
  PLACE_DETAILS: 'PLACE_DETAILS',
} as const;

export type ApiOperation = (typeof API_OPERATIONS)[keyof typeof API_OPERATIONS];

/*
 * Google fiyatlandırması zamanla değişebilir; bu değerler kod içine sabit
 * yazılmaz. .env üzerinden geçersiz kılınabilir.
 * Birim: 1000 istek başına USD.
 */
const PRICE_DEFAULTS_USD_PER_THOUSAND: Record<string, number> = {
  [API_OPERATIONS.TEXT_SEARCH]: 40,
  [API_OPERATIONS.PLACE_DETAILS]: 20,
};

const PRICE_ENV_KEYS: Record<string, string> = {
  [API_OPERATIONS.TEXT_SEARCH]: 'GOOGLE_PLACES_PRICE_TEXT_SEARCH',
  [API_OPERATIONS.PLACE_DETAILS]: 'GOOGLE_PLACES_PRICE_PLACE_DETAILS',
};

export interface RecordUsageInput {
  provider: string;
  operation: string;
  requestCount?: number;
  searchId?: string | null;
}

export interface UsageSummaryItem {
  provider: string;
  operation: string;
  requestCount: number;
  estimatedCost: number;
}

@Injectable()
export class ApiUsageService {
  private readonly logger = new Logger(ApiUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  pricePerThousand(operation: string): number {
    const envKey = PRICE_ENV_KEYS[operation];
    const configured = envKey ? this.config.get<string>(envKey) : undefined;
    const parsed = configured === undefined ? Number.NaN : Number(configured);

    if (Number.isFinite(parsed)) {
      return parsed;
    }

    return PRICE_DEFAULTS_USD_PER_THOUSAND[operation] ?? 0;
  }

  estimateCost(operation: string, requestCount: number): number {
    return (requestCount / 1000) * this.pricePerThousand(operation);
  }

  async record(input: RecordUsageInput): Promise<void> {
    const requestCount = input.requestCount ?? 1;

    try {
      await this.prisma.apiUsage.create({
        data: {
          provider: input.provider,
          operation: input.operation,
          searchId: input.searchId ?? null,
          requestCount,
          estimatedCost: this.estimateCost(input.operation, requestCount),
        },
      });
    } catch (error) {
      this.logger.error(
        'API kullanim kaydi olusturulamadi',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async getSummary(from: Date, to: Date): Promise<UsageSummaryItem[]> {
    const grouped = await this.prisma.apiUsage.groupBy({
      by: ['provider', 'operation'],
      where: { createdAt: { gte: from, lt: to } },
      _sum: { requestCount: true, estimatedCost: true },
    });

    return grouped.map((row) => ({
      provider: row.provider,
      operation: row.operation,
      requestCount: row._sum.requestCount ?? 0,
      estimatedCost: Number(row._sum.estimatedCost ?? 0),
    }));
  }

  async getCurrentMonthSummary(): Promise<{
    from: Date;
    to: Date;
    totalRequests: number;
    estimatedCost: number;
    items: UsageSummaryItem[];
  }> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const items = await this.getSummary(from, to);

    return {
      from,
      to,
      totalRequests: items.reduce((sum, item) => sum + item.requestCount, 0),
      estimatedCost: items.reduce((sum, item) => sum + item.estimatedCost, 0),
      items,
    };
  }
}
