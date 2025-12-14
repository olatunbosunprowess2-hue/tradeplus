import { IsString, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';

export class CreatePromotionDto {
    @IsString()
    listingId: string;

    @IsString()
    @IsIn(['homepage', 'category', 'search', 'all'])
    placement: string;

    @IsInt()
    @Min(1)
    @Max(30)
    durationDays: number;
}

export class PromotionPricingDto {
    placement: string;
    durationDays: number;
    priceNaira: number;
    priceCents: number;
}
