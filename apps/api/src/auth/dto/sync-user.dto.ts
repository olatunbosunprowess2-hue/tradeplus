import { IsString, IsOptional, IsEmail } from 'class-validator';

export class SyncUserDto {
    @IsString()
    supabaseUserId: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    displayName?: string;
}
