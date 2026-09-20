import { Controller, Get } from '@nestjs/common';
import { AppService, type ServiceInfo } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getInfo(): ServiceInfo {
    return this.appService.getInfo();
  }

  @Get('health')
  async getHealth(): Promise<HealthStatus> {
    const database = await this.prisma.isHealthy();

    return {
      status: database ? 'ok' : 'degraded',
      database: database ? 'up' : 'down',
    };
  }
}
