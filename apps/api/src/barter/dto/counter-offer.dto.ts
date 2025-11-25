import { IsString, IsOptional, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CounterOfferItemDto {
    @IsString()
    listingId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CounterOfferDto {
    @IsString()
    @IsOptional()
    message?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CounterOfferItemDto)
    @IsOptional()
    offeredItems?: CounterOfferItemDto[];

    @IsInt()
    @Min(0)
    @IsOptional()
    offeredCashCents?: number;
}
