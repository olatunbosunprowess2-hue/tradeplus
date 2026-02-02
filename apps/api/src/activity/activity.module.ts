import { Module, Global } from '@nestjs/common';
import { ActivityGateway } from './activity.gateway';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Global so it can be injected into Auth/Listings modules to trigger events
@Module({
  imports: [PrismaModule],
  providers: [ActivityGateway, ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService, ActivityGateway],
})

export class ActivityModule { }

