import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiUsageModule } from './api-usage/api-usage.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ExportsModule } from './exports/exports.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { PlacesModule } from './places/places.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SearchesModule } from './searches/searches.module.js';
import { StatsModule } from './stats/stats.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    ApiUsageModule,
    PlacesModule,
    SearchesModule,
    LeadsModule,
    ExportsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
