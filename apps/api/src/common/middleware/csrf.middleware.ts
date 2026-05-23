import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Pre-authentication endpoints that do NOT require CSRF validation.
 * These are public endpoints where the user has no active session to protect.
 * Validating CSRF here would fail on first-ever requests because the browser
 * hasn't received the XSRF-TOKEN cookie yet.
 */
const CSRF_EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/google/callback',
    '/api/auth/logout',
];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // 1. Ensure the user's browser has an XSRF-TOKEN cookie
        let token = req.cookies['XSRF-TOKEN'];
        if (!token) {
            token = crypto.randomBytes(32).toString('hex');
            // CRITICAL: This cookie must NOT be HttpOnly so the frontend can read it.
            res.cookie('XSRF-TOKEN', token, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
        }

        // 2. Validate token on state-changing requests (skip pre-auth endpoints)
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const isExempt = CSRF_EXEMPT_PATHS.some(path => req.path === path || req.originalUrl === path);

            if (!isExempt) {
                // The frontend must read the cookie and attach it to this header
                const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
                if (!headerToken || headerToken !== token) {
                    throw new ForbiddenException('CSRF token validation failed. Possible cross-site request forgery detected.');
                }
            }
        }

        next();
    }
}
