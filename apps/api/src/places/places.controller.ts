import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { getCountry } from '../common/countries.js';
import { SearchPlacesDto } from './dto/search-places.dto.js';
import { PlacesService } from './places.service.js';
import type { NormalizedPlace } from './places.types.js';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post('search')
  search(@Body() dto: SearchPlacesDto): Promise<NormalizedPlace[]> {
    const country = getCountry(dto.country);

    return this.placesService.searchPlaces(
      this.placesService.buildQuery(
        dto.keyword,
        dto.district,
        dto.city,
        country.name,
      ),
      { maxPages: dto.maxPages, regionCode: country.regionCode },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<NormalizedPlace> {
    return this.placesService.getPlaceDetails(id);
  }
}
