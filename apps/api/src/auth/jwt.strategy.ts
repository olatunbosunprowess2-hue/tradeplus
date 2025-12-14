import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        // Use SUPABASE_JWT_SECRET as primary to support Supabase logins
        // Backend-generated tokens should also use this secret for consistency
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        console.log('🔍 JWT Payload:', payload);

        // Use email for lookup to avoid Supabase ID vs local DB ID mismatch
        if (!payload.email) {
            console.error('❌ JWT Payload missing email field');
            throw new UnauthorizedException('Invalid token payload: missing email');
        }

        const user = await this.authService.validateUserByEmail(payload.email);
        if (!user) {
            console.error(`❌ User not found for email: ${payload.email}`);
            throw new UnauthorizedException();
        }

        console.log(`✅ User validated: ${user.email}`);
        return user;
    }
}
