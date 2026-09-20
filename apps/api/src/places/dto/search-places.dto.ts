import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { COUNTRY_CODES, DEFAULT_COUNTRY } from '../../common/countries.js';

export class SearchPlacesDto {
  @IsOptional()
  @IsIn(COUNTRY_CODES)
  country: string = DEFAULT_COUNTRY;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  keyword!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  maxPages?: number;
}
