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

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
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

        // Verify password
        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            dto.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new UnauthorizedException('Account is suspended');
        }

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

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
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

        if (!user || user.status !== 'active') {
            throw new UnauthorizedException();
        }

        return user;
    }
}
