import { Module } from '@nestjs/common';
import { EnrichmentModule } from '../enrichment/enrichment.module.js';
import { PlacesModule } from '../places/places.module.js';
import { SearchesController } from './searches.controller.js';
import { SearchesService } from './searches.service.js';

@Module({
  imports: [PlacesModule, EnrichmentModule],
  controllers: [SearchesController],
  providers: [SearchesService],
  exports: [SearchesService],
})
export class SearchesModule {}
