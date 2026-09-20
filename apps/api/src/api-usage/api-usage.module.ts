import { Global, Module } from '@nestjs/common';
import { ApiUsageService } from './api-usage.service.js';

@Global()
@Module({
  providers: [ApiUsageService],
  exports: [ApiUsageService],
})
export class ApiUsageModule {}
