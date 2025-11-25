import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsInt } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    displayName: string;

    @IsInt()
    @IsOptional()
    countryId?: number;

    @IsInt()
    @IsOptional()
    regionId?: number;
}
