import { Module } from '@nestjs/common';
import { PlacesClient } from './places.client.js';
import { PlacesController } from './places.controller.js';
import { PlacesService } from './places.service.js';

@Module({
  controllers: [PlacesController],
  providers: [PlacesClient, PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
