import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
    @IsEnum(['pending', 'paid', 'cancelled', 'fulfilled'])
    status: 'pending' | 'paid' | 'cancelled' | 'fulfilled';
}
