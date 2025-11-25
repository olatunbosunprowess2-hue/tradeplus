import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateWantDto {
    @IsString()
    title: string;

    @IsString()
    category: string;

    @IsString()
    @IsIn(['cash', 'barter', 'both'])
    tradeMethod: string;

    @IsString()
    @IsIn(['new', 'used', 'any'])
    condition: string;

    @IsString()
    country: string;

    @IsString()
    state: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
