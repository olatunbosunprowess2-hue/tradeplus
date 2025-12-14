import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await argon2.hash(dto.password);

        // Create user and profile
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                profile: {
                    create: {
                        displayName: dto.displayName,
                        countryId: dto.countryId,
                        regionId: dto.regionId,
                    },
                },
            },
            include: {
                profile: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        const result = {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.displayName || undefined,
                role: user.role,
                createdAt: user.createdAt.toISOString(),
                onboardingCompleted: user.onboardingCompleted,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus as 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
                phoneNumber: user.phoneNumber || undefined,
                locationLat: user.locationLat || undefined,
                locationLng: user.locationLng || undefined,
                locationAddress: user.locationAddress || undefined,
                profile: user.profile
                    ? {
                        displayName: user.profile.displayName || undefined,
                        countryId: user.profile.countryId || undefined,
                        regionId: user.profile.regionId || undefined,
                    }
                    : undefined,
            },
        };

        // Send welcome email asynchronously (don't await to not block registration)
        this.emailService.sendWelcome(user.email, user.profile?.displayName || '')
            .then((sent) => {
                console.log(`📧 Welcome email ${sent ? 'sent' : 'failed'} to ${user.email}`);
            })
            .catch((err) => {
                console.error(`📧 Welcome email error for ${user.email}:`, err);
            });

        return result;
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: { profile: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user has a password (Supabase-only users don't)
        if (!user.passwordHash) {
            throw new UnauthorizedException('Please sign in with your social account');
        }

        // Verify password
        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            dto.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Note: We allow suspended users to login so they can see their status and submit appeals
        // The frontend will handle restricting their actions

        // Update last login
        await this.prisma.userProfile.update({
            where: { userId: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.displayName || undefined,
                role: user.role,
                status: user.status as 'active' | 'suspended' | 'banned', // Include account status for suspension detection
                createdAt: user.createdAt.toISOString(),
                onboardingCompleted: user.onboardingCompleted,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus as 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
                rejectionReason: user.rejectionReason || undefined, // Include for suspension reason display
                phoneNumber: user.phoneNumber || undefined,
                locationLat: user.locationLat || undefined,
                locationLng: user.locationLng || undefined,
                locationAddress: user.locationAddress || undefined,
                profile: user.profile
                    ? {
                        displayName: user.profile.displayName || undefined,
                        countryId: user.profile.countryId || undefined,
                        regionId: user.profile.regionId || undefined,
                    }
                    : undefined,
            },
        };
    }

    async syncSupabaseUser(dto: { supabaseUserId: string; email: string; displayName?: string }) {
        // Check if user exists by email
        let user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: { profile: true },
        });

        if (user) {
            // Update last login
            if (user.profile) {
                await this.prisma.userProfile.update({
                    where: { userId: user.id },
                    data: { lastLoginAt: new Date() },
                });
            }

            // Ensure supabaseUserId is linked
            if (user.supabaseUserId !== dto.supabaseUserId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { supabaseUserId: dto.supabaseUserId },
                    include: { profile: true },
                });
            }
        } else {
            // Create new user
            user = await this.prisma.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    supabaseUserId: dto.supabaseUserId,
                    passwordHash: null, // Not used for Supabase auth
                    profile: {
                        create: {
                            displayName: dto.displayName || dto.email.split('@')[0],
                        },
                    },
                },
                include: {
                    profile: true,
                },
            });
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.displayName || undefined,
                role: user.role,
                createdAt: user.createdAt.toISOString(),
                onboardingCompleted: user.onboardingCompleted,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus as 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
                phoneNumber: user.phoneNumber || undefined,
                locationLat: user.locationLat || undefined,
                locationLng: user.locationLng || undefined,
                locationAddress: user.locationAddress || undefined,
                profile: user.profile
                    ? {
                        displayName: user.profile.displayName || undefined,
                        countryId: user.profile.countryId || undefined,
                        regionId: user.profile.regionId || undefined,
                    }
                    : undefined,
            },
        };
    }

    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        // Use JWT_SECRET consistently across the application
        const secret = this.configService.get<string>('JWT_SECRET');

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: secret,
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn:
                    this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: { profile: true },
            });

            if (!user || user.status !== 'active') {
                throw new UnauthorizedException('Access denied');
            }

            const tokens = await this.generateTokens(user.id, user.email);

            return {
                ...tokens,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.profile?.displayName || undefined,
                    role: user.role,
                    createdAt: user.createdAt.toISOString(),
                    onboardingCompleted: user.onboardingCompleted,
                    isVerified: user.isVerified,
                    verificationStatus: user.verificationStatus as 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
                    phoneNumber: user.phoneNumber || undefined,
                    locationLat: user.locationLat || undefined,
                    locationLng: user.locationLng || undefined,
                    locationAddress: user.locationAddress || undefined,
                    profile: user.profile
                        ? {
                            displayName: user.profile.displayName || undefined,
                            countryId: user.profile.countryId || undefined,
                            regionId: user.profile.regionId || undefined,
                        }
                        : undefined,
                },
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }

    async validateUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { profile: true },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }

    // ========================================================================
    // GOOGLE OAUTH
    // ========================================================================
    async googleCallback(dto: { code: string; codeVerifier?: string; redirectUri: string }): Promise<AuthResponseDto> {
        const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const googleClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

        if (!googleClientId || !googleClientSecret) {
            throw new UnauthorizedException('Google OAuth not configured');
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: dto.code,
                client_id: googleClientId,
                client_secret: googleClientSecret,
                redirect_uri: dto.redirectUri,
                grant_type: 'authorization_code',
                ...(dto.codeVerifier ? { code_verifier: dto.codeVerifier } : {}),
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Google token exchange failed:', error);
            throw new UnauthorizedException('Failed to authenticate with Google');
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new UnauthorizedException('Failed to get Google user info');
        }

        const googleUser = await userInfoResponse.json();

        // Find or create user
        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email.toLowerCase() },
            include: { profile: true },
        });

        if (!user) {
            // Create new user from Google account
            user = await this.prisma.user.create({
                data: {
                    email: googleUser.email.toLowerCase(),
                    googleId: googleUser.id,
                    isVerified: googleUser.verified_email || false,
                    profile: {
                        create: {
                            displayName: googleUser.name || googleUser.email.split('@')[0],
                            avatarUrl: googleUser.picture,
                        },
                    },
                },
                include: { profile: true },
            });
        } else {
            // Link Google ID if not already linked
            if (!user.googleId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: googleUser.id },
                    include: { profile: true },
                });
            }

            // Update last login
            if (user.profile) {
                await this.prisma.userProfile.update({
                    where: { userId: user.id },
                    data: { lastLoginAt: new Date() },
                });
            }
        }

        // Note: We allow suspended users to login so they can see their status
        // Frontend will handle restrictions

        // Generate our own tokens
        const jwtTokens = await this.generateTokens(user.id, user.email);

        return {
            ...jwtTokens,
            user: this.formatUserResponse(user),
        };
    }

    // ========================================================================
    // FORGOT PASSWORD
    // ========================================================================
    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return { message: 'If an account exists, password reset instructions have been sent.' };
        }

        // Generate password reset token
        const resetToken = await this.jwtService.signAsync(
            { sub: user.id, type: 'password_reset' },
            {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '1h',
            }
        );

        // Store reset token in database
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
            },
        });

        // Send password reset email
        await this.emailService.sendPasswordReset(user.email, resetToken);

        return { message: 'If an account exists, password reset instructions have been sent.' };
    }

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            if (payload.type !== 'password_reset') {
                throw new UnauthorizedException('Invalid reset token');
            }

            const user = await this.prisma.user.findFirst({
                where: {
                    id: payload.sub,
                    passwordResetToken: token,
                    passwordResetExpires: { gt: new Date() },
                },
            });

            if (!user) {
                throw new UnauthorizedException('Invalid or expired reset token');
            }

            // Hash new password
            const passwordHash = await argon2.hash(newPassword);

            // Update password and clear reset token
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            });

            return { message: 'Password has been reset successfully.' };
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }
    }

    // ========================================================================
    // HELPER: Format user response
    // ========================================================================
    private formatUserResponse(user: any) {
        return {
            id: user.id,
            email: user.email,
            name: user.profile?.displayName || undefined,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            onboardingCompleted: user.onboardingCompleted,
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus as 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED',
            phoneNumber: user.phoneNumber || undefined,
            locationLat: user.locationLat || undefined,
            locationLng: user.locationLng || undefined,
            locationAddress: user.locationAddress || undefined,
            profile: user.profile
                ? {
                    displayName: user.profile.displayName || undefined,
                    countryId: user.profile.countryId || undefined,
                    regionId: user.profile.regionId || undefined,
                    avatarUrl: user.profile.avatarUrl || undefined,
                }
                : undefined,
        };
    }

    // ========================================================================
    // OTP VERIFICATION
    // ========================================================================

    async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
        // Check if email already registered
        const existingUser = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return { success: false, message: 'Email is already registered. Please login instead.' };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing OTPs for this email
        await this.prisma.emailVerification.deleteMany({
            where: { email: email.toLowerCase() },
        });

        // Create new OTP record
        await this.prisma.emailVerification.create({
            data: {
                email: email.toLowerCase(),
                otp,
                expiresAt,
            },
        });

        // Send OTP email
        const emailSent = await this.emailService.sendOtp(email, otp);

        if (!emailSent) {
            return { success: false, message: 'Failed to send verification email. Please try again.' };
        }

        return { success: true, message: 'Verification code sent to your email.' };
    }

    async verifyOtp(email: string, otp: string): Promise<{ verified: boolean; message: string }> {
        const verification = await this.prisma.emailVerification.findFirst({
            where: {
                email: email.toLowerCase(),
                verified: false,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!verification) {
            return { verified: false, message: 'No verification request found. Please request a new code.' };
        }

        // Check if expired
        if (new Date() > verification.expiresAt) {
            await this.prisma.emailVerification.delete({ where: { id: verification.id } });
            return { verified: false, message: 'Verification code has expired. Please request a new one.' };
        }

        // Check attempts
        if (verification.attempts >= 3) {
            await this.prisma.emailVerification.delete({ where: { id: verification.id } });
            return { verified: false, message: 'Too many attempts. Please request a new code.' };
        }

        // Verify OTP
        if (verification.otp !== otp) {
            await this.prisma.emailVerification.update({
                where: { id: verification.id },
                data: { attempts: verification.attempts + 1 },
            });
            return { verified: false, message: `Invalid code. ${2 - verification.attempts} attempts remaining.` };
        }

        // Mark as verified
        await this.prisma.emailVerification.update({
            where: { id: verification.id },
            data: { verified: true },
        });

        return { verified: true, message: 'Email verified successfully!' };
    }

    async isEmailVerified(email: string): Promise<boolean> {
        const verification = await this.prisma.emailVerification.findFirst({
            where: {
                email: email.toLowerCase(),
                verified: true,
            },
        });
        return !!verification;
    }
}

