import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    displayName?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @IsInt()
    @IsOptional()
    countryId?: number;

    @IsInt()
    @IsOptional()
    regionId?: number;
}
