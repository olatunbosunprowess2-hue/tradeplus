import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateDisputeDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsString()
    @IsNotEmpty()
    reason: string; // 'item_not_as_described', 'seller_no_show', 'buyer_no_show', 'fraud', 'other'

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    description: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    evidenceImages?: string[];
}
