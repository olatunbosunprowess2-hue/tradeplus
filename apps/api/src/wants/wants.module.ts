import { Module } from '@nestjs/common';
import { WantsService } from './wants.service';
import { WantsController } from './wants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WantsController],
    providers: [WantsService],
    exports: [WantsService],
})
export class WantsModule { }
