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

    async findAll(search?: string) {
        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                role: true,
                userRole: { select: { name: true, level: true } },
                profile: { select: { displayName: true, avatarUrl: true } },
                verificationStatus: true
            },
            take: 20
        });
    }

    async findAllAdmins() {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'admin' },
                    { roleId: { not: null } }
                ]
            },
            select: {
                id: true,
                email: true,
                role: true,
                userRole: { select: { name: true, level: true } },
                profile: { select: { displayName: true } },
                verificationStatus: true
            }
        });
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
        // Map RBAC role name to Flattened role if needed, or just return
        return result;
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
            ...profileData
        } = dto;

        // Update User fields if present
        if (verificationStatus || idDocumentType || idDocumentFrontUrl || idDocumentBackUrl || faceVerificationUrl || phoneNumber || onboardingCompleted !== undefined || firstName || lastName || locationAddress) {

            // Fetch current user to check if verification status is changing
            const currentUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { verificationStatus: true }
            });

            // Only notify admins if status is CHANGING TO PENDING (not if it's already PENDING)
            if (verificationStatus === 'PENDING' && currentUser?.verificationStatus !== 'PENDING') {
                const admins = await this.prisma.user.findMany({
                    where: { role: 'admin' }
                });

                for (const admin of admins) {
                    await this.notificationsService.create(
                        admin.id,
                        'VERIFICATION_REQUEST',
                        {
                            userId,
                            message: `New verification request from ${firstName || 'a user'}`,
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
            if (locationLat !== undefined) userData.locationLat = locationLat;
            if (locationLng !== undefined) userData.locationLng = locationLng;

            await this.prisma.user.update({
                where: { id: userId },
                data: userData,
            });
        }

        // Update or create Profile fields
        const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            update: {
                ...profileData,
            },
            create: {
                userId,
                ...profileData,
            },
            include: {
                country: true,
                region: true,
            },
        });

        // Return full user object to keep auth store in sync
        return this.findOne(userId);
    }
}
