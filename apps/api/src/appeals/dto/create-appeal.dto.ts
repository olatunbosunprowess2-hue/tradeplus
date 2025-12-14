import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateAppealDto {
    @IsOptional()
    @IsString()
    reportId?: string;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsNotEmpty()
    @IsString()
    message: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    evidenceImages?: string[];
}
