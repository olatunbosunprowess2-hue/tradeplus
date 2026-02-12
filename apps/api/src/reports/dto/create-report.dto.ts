import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReportDto {
    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    @ValidateIf((o) => !o.reportedUserId || o.listingId)
    listingId?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    @ValidateIf((o) => !o.listingId || o.reportedUserId)
    reportedUserId?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value === "" ? null : value)
    @ValidateIf((o) => !o.listingId && !o.reportedUserId)
    communityPostId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    evidenceImages?: string[];
}
