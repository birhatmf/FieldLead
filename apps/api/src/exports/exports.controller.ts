import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ExportQueryDto,
  LeadsExportQueryDto,
} from './dto/export-query.dto.js';
import { ExportsService, type ExportFile } from './exports.service.js';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('leads.csv')
  async leadsCsv(
    @Query() query: LeadsExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    this.send(response, await this.exportsService.exportLeads(query, 'csv'));
  }

  @Get('leads.xlsx')
  async leadsXlsx(
    @Query() query: LeadsExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    this.send(response, await this.exportsService.exportLeads(query, 'xlsx'));
  }

  @Get('searches/:id/csv')
  async searchCsv(
    @Param('id') id: string,
    @Query() query: ExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    this.send(
      response,
      await this.exportsService.exportSearch(id, query, 'csv'),
    );
  }

  @Get('searches/:id/xlsx')
  async searchXlsx(
    @Param('id') id: string,
    @Query() query: ExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    this.send(
      response,
      await this.exportsService.exportSearch(id, query, 'xlsx'),
    );
  }

  private send(response: Response, file: ExportFile): void {
    const asciiName = file.filename.replace(/[^\x20-\x7E]/g, '_');

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    );
    response.setHeader('Content-Length', file.body.byteLength);
    response.end(file.body);
  }
}
