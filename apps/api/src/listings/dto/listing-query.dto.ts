import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ListingQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    categoryId?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sellerId?: string;

    @IsOptional()
    @IsEnum(['new', 'used'])
    condition?: 'new' | 'used';

    @IsOptional()
    @IsEnum(['PHYSICAL', 'SERVICE'])
    type?: 'PHYSICAL' | 'SERVICE';

    @IsOptional()
    @IsEnum(['cash', 'barter', 'cash_plus_barter'])
    paymentMode?: 'cash' | 'barter' | 'cash_plus_barter';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    countryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    regionId?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isDistressSale?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    includeAll?: string;

    @IsOptional()
    @IsString()
    ids?: string; // Comma-separated list of IDs
}
