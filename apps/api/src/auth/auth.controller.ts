import { Controller, Post, Body, Get, UseGuards, Request, Query, Res, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailService } from '../email/email.service';

@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 auth requests per minute (stricter than global 100/min)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly emailService: EmailService,
    ) { }

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        console.log('Register request:', dto);
        try {
            const result = await this.authService.register(dto);

            // Set HttpOnly Cookies
            this.setCookies(res, result.accessToken, result.refreshToken);

            // Return tokens AND user for cross-origin compatibility
            return {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            };
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    // ========================================================================
    // OTP VERIFICATION
    // ========================================================================

    /**
     * Send OTP to email for verification
     * POST /api/auth/send-otp
     */
    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto.email);
    }

    /**
     * Verify OTP
     * POST /api/auth/verify-otp
     */
    @Post('verify-otp')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto.email, dto.otp);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto);

        // Set HttpOnly Cookies
        this.setCookies(res, result.accessToken, result.refreshToken);

        // Return tokens AND user for cross-origin compatibility
        return {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        };
    }

    @Post('refresh')
    async refresh(@Request() req, @Body('refreshToken') bodyRefreshToken: string, @Res({ passthrough: true }) res: Response) {
        // Extract refresh token from cookie or body as fallback
        const refreshToken = bodyRefreshToken || req.cookies['refresh_token'];

        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token found. Please login.');
        }

        const result = await this.authService.refreshTokens(refreshToken);

        // Update Cookies
        this.setCookies(res, result.accessToken, result.refreshToken);

        // Return tokens AND user for cross-origin compatibility
        return {
            message: 'Tokens refreshed',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req) {
        return req.user;
    }

    // ========================================================================
    // GOOGLE OAUTH
    // ========================================================================

    /**
     * Redirect to Google OAuth
     * GET /api/auth/google
     */
    @Get('google')
    async googleAuth(@Res() res: Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

        if (!clientId) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                message: 'Google OAuth not configured',
            });
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });

        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    }

    /**
     * Handle Google OAuth callback (server-side flow)
     * GET /api/auth/google/callback
     */
    @Get('google/callback')
    async googleCallbackGet(
        @Query('code') code: string,
        @Query('error') error: string,
        @Res() res: Response,
    ) {
        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${error}`);
        }

        try {
            const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
            const result = await this.authService.googleCallback({
                code,
                redirectUri,
            });

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const params = new URLSearchParams({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            });

            return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
        } catch (err) {
            console.error('Google callback error:', err);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
        }
    }

    /**
     * Handle Google OAuth callback (client-side PKCE flow)
     * POST /api/auth/google/callback
     */
    @Post('google/callback')
    async googleCallbackPost(
        @Body() body: { code: string; codeVerifier?: string; redirectUri: string },
    ) {
        return this.authService.googleCallback(body);
    }

    // ========================================================================
    // PASSWORD RESET
    // ========================================================================

    /**
     * Request password reset
     * POST /api/auth/forgot-password
     */
    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    /**
     * Reset password with token
     * POST /api/auth/reset-password
     */
    @Post('reset-password')
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ) {
        return this.authService.resetPassword(token, newPassword);
    }

    /**
     * Change password (authenticated)
     * POST /api/auth/change-password
     */
    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Request() req: any,
        @Body('currentPassword') currentPassword: string,
        @Body('newPassword') newPassword: string,
    ) {
        if (!currentPassword || !newPassword) {
            return { statusCode: 400, message: 'Both currentPassword and newPassword are required.' };
        }
        if (newPassword.length < 8) {
            return { statusCode: 400, message: 'New password must be at least 8 characters.' };
        }
        return this.authService.changePassword(req.user.sub, currentPassword, newPassword);
    }

    // ========================================================================
    // LOGOUT
    // ========================================================================

    /**
     * Logout (invalidate refresh token)
     * POST /api/auth/logout
     */
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        // Clear cookies with same path they were set with
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });

        return { message: 'Logged out successfully' };
    }

    // Helper to set cookies
    private setCookies(res: Response, accessToken: string, refreshToken: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            path: '/', // Send with all requests so refresh endpoint can access it
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    /**
     * Test email endpoint (dev only)
     * GET /api/auth/test-email?to=email@example.com
     */
    @Get('test-email')
    async testEmail(@Query('to') to: string) {
        if (!to) {
            return { success: false, error: 'Please provide ?to=email@example.com' };
        }
        console.log(`\n🧪 TEST EMAIL REQUEST to: ${to}`);

        const result = await this.emailService.sendWelcome(to, 'Test User');

        return {
            success: result,
            message: result ? 'Email sent! Check your inbox.' : 'Email failed to send. Check server logs.',
            sentTo: to
        };
    }
}
