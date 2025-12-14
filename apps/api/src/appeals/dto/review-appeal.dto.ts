import { IsString, IsIn, IsOptional } from 'class-validator';

export class ReviewAppealDto {
    @IsString()
    @IsIn(['approved', 'rejected'])
    decision: 'approved' | 'rejected';

    @IsString()
    @IsOptional()
    adminMessage?: string;
}
