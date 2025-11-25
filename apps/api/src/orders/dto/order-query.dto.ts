import { IsOptional, IsEnum } from 'class-validator';

export class OrderQueryDto {
    @IsOptional()
    @IsEnum(['bought', 'sold'])
    type?: 'bought' | 'sold';

    @IsOptional()
    @IsEnum(['pending', 'paid', 'cancelled', 'fulfilled'])
    status?: 'pending' | 'paid' | 'cancelled' | 'fulfilled';
}
