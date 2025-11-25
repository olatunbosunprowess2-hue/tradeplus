import { PartialType } from '@nestjs/mapped-types';
import { CreateWantDto } from './create-want.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWantDto extends PartialType(CreateWantDto) {
    @IsBoolean()
    @IsOptional()
    isFulfilled?: boolean;
}
