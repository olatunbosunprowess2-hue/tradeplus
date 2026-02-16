import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async findAll(search?: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    userRole: { select: { name: true, level: true } },
                    profile: { select: { displayName: true, avatarUrl: true, lastActiveAt: true } },
                    verificationStatus: true,
                    createdAt: true
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findAllAdmins(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const where = {
            OR: [
                { role: 'admin' },
                { roleId: { not: null } }
            ]
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    userRole: { select: { name: true, level: true } },
                    profile: { select: { displayName: true, lastActiveAt: true } },
                    verificationStatus: true,
                    createdAt: true
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }


    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: {
                    include: {
                        country: true,
                        region: true,
                    },
                },
                userRole: true // Include RBAC role
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    async findPublicProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isVerified: true,
                verificationStatus: true,
                brandVerificationStatus: true,
                brandName: true,
                createdAt: true,
                locationAddress: true,
                city: true,
                state: true,
                brandPhysicalAddress: true,
                averageRating: true,
                totalReviews: true,
                profile: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                        bio: true,
                        responseRate: true,
                        country: true,
                        region: true,
                        lastActiveAt: true,
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const {
            verificationStatus,
            idDocumentType,
            idDocumentFrontUrl,
            idDocumentBackUrl,
            faceVerificationUrl,
            phoneNumber,
            onboardingCompleted,
            firstName,
            lastName,
            locationAddress,
            locationLat,
            locationLng,
            city,
            state,
            ...profileData
        } = dto;

        // Update User fields if present
        if (verificationStatus || idDocumentType || idDocumentFrontUrl || idDocumentBackUrl || faceVerificationUrl || phoneNumber || onboardingCompleted !== undefined || firstName || lastName || locationAddress || city || state) {

            // Fetch current user to check if verification status is changing
            const currentUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { verificationStatus: true }
            });

            // Only notify staff if status is CHANGING TO PENDING (not if it's already PENDING)
            if (verificationStatus === 'PENDING' && currentUser?.verificationStatus !== 'PENDING') {
                const staff = await this.prisma.user.findMany({
                    where: {
                        OR: [
                            { role: 'admin' },
                            {
                                userRole: {
                                    level: { gte: 50 } // Moderator level and above
                                }
                            }
                        ]
                    }
                });

                const userForName = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, firstName: true }
                });

                for (const person of staff) {
                    await this.notificationsService.create(
                        person.id,

                        'VERIFICATION_REQUEST',
                        {
                            userId,
                            userEmail: userForName?.email,
                            message: `New verification request from ${firstName || userForName?.firstName || 'a user'}`,
                            timestamp: new Date()
                        }
                    );
                }
            }

            const userData: any = {};
            if (verificationStatus !== undefined) userData.verificationStatus = verificationStatus;
            if (idDocumentType !== undefined) userData.idDocumentType = idDocumentType;
            if (idDocumentFrontUrl !== undefined) userData.idDocumentFrontUrl = idDocumentFrontUrl;
            if (idDocumentBackUrl !== undefined) userData.idDocumentBackUrl = idDocumentBackUrl;
            if (faceVerificationUrl !== undefined) userData.faceVerificationUrl = faceVerificationUrl;
            if (phoneNumber !== undefined) userData.phoneNumber = phoneNumber;
            if (onboardingCompleted !== undefined) userData.onboardingCompleted = onboardingCompleted;
            if (firstName !== undefined) userData.firstName = firstName;
            if (lastName !== undefined) userData.lastName = lastName;
            if (locationAddress !== undefined) userData.locationAddress = locationAddress;
            if (city !== undefined) userData.city = city;
            if (state !== undefined) userData.state = state;
            if (locationLat !== undefined) userData.locationLat = locationLat;
            if (locationLng !== undefined) userData.locationLng = locationLng;

            await this.prisma.user.update({
                where: { id: userId },
                data: userData,
            });

            // Auto-sync displayName in profile when firstName/lastName change
            if (firstName !== undefined || lastName !== undefined) {
                const updatedUser = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true }
                });
                if (updatedUser) {
                    const generatedDisplayName = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
                    if (generatedDisplayName) {
                        await this.prisma.userProfile.upsert({
                            where: { userId },
                            update: { displayName: generatedDisplayName },
                            create: { userId, displayName: generatedDisplayName },
                        });
                    }
                }
            }
        }

        // Update or create Profile fields
        // Only trigger upsert if we have profile data to update/create
        if (Object.keys(profileData).length > 0) {
            await this.prisma.userProfile.upsert({
                where: { userId },
                update: {
                    ...profileData,
                },
                create: {
                    userId,
                    ...profileData,
                },
            });
        }


        // Return full user object to keep auth store in sync
        return this.findOne(userId);
    }
}
