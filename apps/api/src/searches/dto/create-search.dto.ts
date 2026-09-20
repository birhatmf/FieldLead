import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
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

export const MAX_KEYWORDS_HARD_LIMIT = 50;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export class CreateSearchDto {
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

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(MAX_KEYWORDS_HARD_LIMIT)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  keywords!: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  maxPages?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  enrichEmails?: boolean;
}

export class SearchStatusFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class SearchListQueryDto extends SearchStatusFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class SearchResultsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 50;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minReviewCount?: number;

  @IsOptional()
  @Transform(toBoolean)
  hasPhone?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  hasWebsite?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  hasEmail?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  sortBy: string = 'userRatingCount';

  @IsOptional()
  @IsString()
  @MaxLength(4)
  sortOrder: string = 'desc';
}
