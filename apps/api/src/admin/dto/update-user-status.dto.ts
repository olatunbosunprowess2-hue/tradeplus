import { IsEnum } from 'class-validator';

export class UpdateUserStatusDto {
    @IsEnum(['active', 'suspended'])
    status: 'active' | 'suspended';
}
