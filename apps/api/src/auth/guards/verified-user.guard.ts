import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false; // Should be used after JwtAuthGuard
        }

        if (!user.isVerified) {
            throw new ForbiddenException('Identity verification is required to perform this action.');
        }

        return true;
    }
}
