import { Injectable } from '@nestjs/common';
import { ApiUsageService } from '../api-usage/api-usage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUsage: ApiUsageService,
  ) {}

  async getOverview() {
    const [placeCount, leadCount, searchCount, leadsByStatus, recentSearches, usage] =
      await Promise.all([
        this.prisma.place.count(),
        this.prisma.lead.count(),
        this.prisma.search.count(),
        this.prisma.lead.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.search.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.apiUsage.getCurrentMonthSummary(),
      ]);

    return {
      places: { total: placeCount },
      leads: {
        total: leadCount,
        byStatus: Object.fromEntries(
          leadsByStatus.map((row) => [row.status, row._count._all]),
        ),
      },
      searches: { total: searchCount, recent: recentSearches },
      apiUsage: {
        periodStart: usage.from,
        periodEnd: usage.to,
        totalRequests: usage.totalRequests,
        estimatedCost: usage.estimatedCost,
        items: usage.items,
      },
    };
  }
}
