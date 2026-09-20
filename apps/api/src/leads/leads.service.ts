import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus } from '@fieldlead/database';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateLeadDto,
  LeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto.js';

const SORTABLE_FIELDS = new Set(['createdAt', 'updatedAt', 'status']);
const PLACE_SORTABLE_FIELDS = new Set(['name', 'rating', 'userRatingCount']);

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(dto: CreateLeadDto) {
    const uniquePlaceIds = [...new Set(dto.placeIds)];

    const existingPlaces = await this.prisma.place.findMany({
      where: { id: { in: uniquePlaceIds } },
      select: { id: true },
    });

    if (existingPlaces.length !== uniquePlaceIds.length) {
      throw new BadRequestException(
        'Bazi isletmeler bulunamadi; gecersiz placeIds gonderildi.',
      );
    }

    const { count } = await this.prisma.lead.createMany({
      data: uniquePlaceIds.map((placeId) => ({
        placeId,
        status: dto.status ?? LeadStatus.NEW,
        assignedTo: dto.assignedTo ?? null,
        notes: dto.notes ?? null,
      })),
      skipDuplicates: true,
    });

    const items = await this.prisma.lead.findMany({
      where: { placeId: { in: uniquePlaceIds } },
      include: { place: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      requested: uniquePlaceIds.length,
      created: count,
      skipped: uniquePlaceIds.length - count,
      items,
    };
  }

  async findAll(query: LeadsQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const sortBy = SORTABLE_FIELDS.has(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.assignedTo ? { assignedTo: query.assignedTo } : {}),
      ...(query.search || query.hasPhone !== undefined || query.hasWebsite !== undefined
        ? {
            place: {
              ...(query.search
                ? {
                    name: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  }
                : {}),
              ...(query.hasPhone === true ? { phone: { not: null } } : {}),
              ...(query.hasPhone === false ? { phone: null } : {}),
              ...(query.hasWebsite === true ? { website: { not: null } } : {}),
              ...(query.hasWebsite === false ? { website: null } : {}),
            },
          }
        : {}),
    };

    const orderBy = PLACE_SORTABLE_FIELDS.has(sortBy)
      ? { place: { [sortBy]: sortOrder } }
      : { [sortBy]: sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: { place: true, assignee: { select: { id: true, name: true } } },
        orderBy,
        skip,
        take: query.pageSize,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        place: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead bulunamadi: ${id}`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedTo !== undefined
          ? { assignedTo: dto.assignedTo }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { place: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.lead.delete({ where: { id } });
  }

  async getStatusCounts(): Promise<Record<string, number>> {
    const grouped = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return Object.fromEntries(
      grouped.map((row) => [row.status, row._count._all]),
    );
  }
}
