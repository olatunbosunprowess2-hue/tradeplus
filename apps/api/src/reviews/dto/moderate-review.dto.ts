import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ModerateReviewDto {
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @IsBoolean()
    @IsOptional()
    flagged?: boolean;

    @IsString()
    @IsOptional()
    adminResponse?: string;
}
