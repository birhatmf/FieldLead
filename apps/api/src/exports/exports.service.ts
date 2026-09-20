import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@fieldlead/database';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service.js';
import { EXPORT_COLUMNS, type ExportRow } from './export-columns.js';
import type {
  ExportQueryDto,
  LeadsExportQueryDto,
} from './dto/export-query.dto.js';

export interface ExportFile {
  filename: string;
  contentType: string;
  body: Buffer;
}

const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';
const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/*
 * Turkce Excel yerel ayarinda liste ayirici noktali virguldur; ayrica Turkce
 * karakterlerin dogru gorunmesi icin CSV'ye UTF-8 BOM eklenir.
 */
const CSV_DELIMITER = ';';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  private readonly maxRows: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.maxRows = Number(this.config.get<string>('EXPORT_MAX_ROWS') ?? 10000);
  }

  async exportLeads(
    query: LeadsExportQueryDto,
    format: 'csv' | 'xlsx',
  ): Promise<ExportFile> {
    const rows = await this.loadLeadRows(query);
    const name = ['FieldLead', 'Leadler'];

    return format === 'csv'
      ? this.buildCsv(rows, name)
      : this.buildXlsx(rows, name, 'Leadler');
  }

  async exportSearch(
    searchId: string,
    query: ExportQueryDto,
    format: 'csv' | 'xlsx',
  ): Promise<ExportFile> {
    const search = await this.prisma.search.findUnique({
      where: { id: searchId },
    });

    if (!search) {
      throw new NotFoundException(`Arama bulunamadi: ${searchId}`);
    }

    const rows = await this.loadSearchRows(searchId, query);
    const name = ['FieldLead', search.city, search.district];
    const sheetName = `${search.city}-${search.district}`.slice(0, 31);

    return format === 'csv'
      ? this.buildCsv(rows, name)
      : this.buildXlsx(rows, name, sheetName);
  }

  private async loadLeadRows(query: LeadsExportQueryDto): Promise<ExportRow[]> {
    const place = this.placeFilters(query);

    const rows = await this.prisma.lead.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(place ? { place } : {}),
      },
      include: {
        place: true,
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: this.maxRows,
    });

    return rows.map((row) => ({
      place: row.place,
      lead: {
        status: row.status,
        notes: row.notes,
        createdAt: row.createdAt,
        assignee: row.assignee,
      },
    }));
  }

  private async loadSearchRows(
    searchId: string,
    query: ExportQueryDto,
  ): Promise<ExportRow[]> {
    const place = this.placeFilters(query);

    const rows = await this.prisma.searchResult.findMany({
      where: {
        searchId,
        ...(place ? { place } : {}),
      },
      include: {
        place: {
          include: {
            leads: {
              include: { assignee: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { place: { userRatingCount: 'desc' } },
      take: this.maxRows,
    });

    return rows.map((row) => ({
      place: row.place,
      matchedKeywords: row.keywords,
      lead: row.place.leads[0]
        ? {
            status: row.place.leads[0].status,
            notes: row.place.leads[0].notes,
            createdAt: row.place.leads[0].createdAt,
            assignee: row.place.leads[0].assignee,
          }
        : null,
    }));
  }

  private placeFilters(query: ExportQueryDto): Prisma.PlaceWhereInput | null {
    const filters: Prisma.PlaceWhereInput = {};

    if (query.search) {
      filters.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query.category) {
      filters.category = query.category;
    }

    if (query.minRating !== undefined) {
      filters.rating = { gte: query.minRating };
    }

    if (query.minReviewCount !== undefined) {
      filters.userRatingCount = { gte: query.minReviewCount };
    }

    if (query.hasPhone === true) filters.phone = { not: null };
    if (query.hasPhone === false) filters.phone = null;
    if (query.hasWebsite === true) filters.website = { not: null };
    if (query.hasWebsite === false) filters.website = null;
    if (query.hasEmail === true) filters.email = { not: null };
    if (query.hasEmail === false) filters.email = null;

    return Object.keys(filters).length > 0 ? filters : null;
  }

  private buildCsv(rows: ExportRow[], nameParts: string[]): ExportFile {
    const escape = (value: string | number | null | undefined): string => {
      const text = value === null || value === undefined ? '' : String(value);

      return /[";\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
    };

    const lines = [
      EXPORT_COLUMNS.map((column) => escape(column.header)).join(CSV_DELIMITER),
      ...rows.map((row) =>
        EXPORT_COLUMNS.map((column) => escape(column.value(row))).join(
          CSV_DELIMITER,
        ),
      ),
    ];

    return {
      filename: this.buildFilename(nameParts, 'csv'),
      contentType: CSV_CONTENT_TYPE,
      body: Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8'),
    };
  }

  private async buildXlsx(
    rows: ExportRow[],
    nameParts: string[],
    sheetName: string,
  ): Promise<ExportFile> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FieldLead';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = EXPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.header,
      width: column.width,
    }));

    for (const row of rows) {
      sheet.addRow(EXPORT_COLUMNS.map((column) => column.value(row) ?? ''));
    }

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE4ECFC' },
    };

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: EXPORT_COLUMNS.length },
    };

    return {
      filename: this.buildFilename(nameParts, 'xlsx'),
      contentType: XLSX_CONTENT_TYPE,
      body: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }

  private buildFilename(nameParts: string[], extension: string): string {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const safeName = nameParts
      .join('_')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80);

    return `${safeName || 'FieldLead'}_${stamp}.${extension}`;
  }
}
