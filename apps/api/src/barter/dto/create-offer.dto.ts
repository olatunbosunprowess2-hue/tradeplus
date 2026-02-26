import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OfferItemDto {
    @IsString()
    @IsNotEmpty()
    listingId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOfferDto {
    @IsString()
    @IsNotEmpty()
    targetListingId: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OfferItemDto)
    @IsOptional()
    offeredItems?: OfferItemDto[];

    @IsInt()
    @Min(0)
    @IsOptional()
    offeredCashCents?: number;

    @IsString()
    @IsOptional()
    currencyCode?: string;
}
