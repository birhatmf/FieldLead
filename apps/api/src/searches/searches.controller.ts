import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateSearchDto,
  SearchListQueryDto,
  SearchResultsQueryDto,
} from './dto/create-search.dto.js';
import { SearchesService } from './searches.service.js';

@Controller('searches')
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Post()
  create(@Body() dto: CreateSearchDto) {
    return this.searchesService.create(dto);
  }

  @Get()
  findAll(@Query() query: SearchListQueryDto) {
    return this.searchesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: SearchResultsQueryDto) {
    return this.searchesService.findOne(id, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.searchesService.remove(id);
  }
}
