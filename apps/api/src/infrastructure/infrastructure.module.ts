import { Module, Global } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';

@Global()
@Module({
    providers: [InfrastructureService],
    exports: [InfrastructureService],
})
export class InfrastructureModule { }
