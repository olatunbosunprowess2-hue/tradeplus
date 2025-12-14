import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SecurityService } from '../security.service';

@Injectable()
export class IpBlockGuard implements CanActivate {
    constructor(private securityService: SecurityService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || request.connection.remoteAddress;

        if (ip && await this.securityService.isIpBlocked(ip)) {
            throw new ForbiddenException('Access Denied from this IP Address.');
        }

        return true;
    }
}
