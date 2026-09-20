import { Module } from '@nestjs/common';
import { EmailExtractorService } from './email-extractor.service.js';

@Module({
  providers: [EmailExtractorService],
  exports: [EmailExtractorService],
})
export class EnrichmentModule {}
