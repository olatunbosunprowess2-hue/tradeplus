import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ReviewQueryDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === "" ? undefined : value)
    userId?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === "" ? undefined : value)
    listingId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
