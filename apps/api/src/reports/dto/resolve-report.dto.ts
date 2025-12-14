import { IsString, IsOptional } from 'class-validator';

export class ResolveReportDto {
    @IsString()
    @IsOptional()
    adminMessage?: string;
}
