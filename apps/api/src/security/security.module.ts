import { Module, Global } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
    imports: [ScheduleModule.forRoot()], // Enable Cron
    controllers: [SecurityController],
    providers: [SecurityService],
    exports: [SecurityService],
})
export class SecurityModule { }
