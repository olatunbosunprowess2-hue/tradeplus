import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { BrandApplyDto, WaitlistDto, BrandRejectDto } from './dto/brand-verification.dto';

@Injectable()
export class BrandVerificationService {
    private readonly logger = new Logger(BrandVerificationService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) { }

    // ========================================================================
    // USER-FACING ENDPOINTS
    // ========================================================================

    /**
     * Submit a brand verification application
     */
    async applyForBrandVerification(userId: string, dto: BrandApplyDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Check if already verified or pending
        if (user.brandVerificationStatus === 'VERIFIED_BRAND') {
            throw new BadRequestException('You are already a verified brand');
        }
        if (user.brandVerificationStatus === 'PENDING') {
            throw new BadRequestException('You already have a pending brand application');
        }

        // Update user with brand application data
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                brandVerificationStatus: 'PENDING',
                brandName: dto.brandName,
                brandWebsite: dto.brandWebsite || null,
                brandInstagram: dto.brandInstagram || null,
                brandTwitter: dto.brandTwitter || null,
                brandLinkedin: dto.brandLinkedin || null,
                brandFacebook: dto.brandFacebook || null,
                brandTiktok: dto.brandTiktok || null,
                brandPhysicalAddress: dto.brandPhysicalAddress || null,
                brandPhoneNumber: dto.brandPhoneNumber || null,
                brandWhatsApp: dto.brandWhatsApp || null,
                brandApplicationNote: dto.brandApplicationNote || null,
                brandProofUrls: dto.brandProofUrls || [],
            },
            select: {
                id: true,
                brandVerificationStatus: true,
                brandName: true,
            },
        });

        // Send admin notification (email + in-app)
        await this.notifyAdminOfApplication(user.id, dto.brandName, user.email);

        this.logger.log(`Brand application submitted by user ${userId} (${dto.brandName})`);
        return { message: 'Brand application submitted successfully', status: updated.brandVerificationStatus };
    }

    /**
     * Get current brand verification status for authenticated user
     */
    async getMyBrandStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                brandVerificationStatus: true,
                brandName: true,
                brandWebsite: true,
                brandInstagram: true,
                brandTwitter: true,
                brandLinkedin: true,
                brandFacebook: true,
                brandTiktok: true,
                brandPhysicalAddress: true,
                brandPhoneNumber: true,
                brandWhatsApp: true,
                brandApplicationNote: true,
                brandProofUrls: true,
                brandVerifiedAt: true,
                brandRejectionReason: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    /**
     * Join the waitlist (no auth required)
     */
    async joinWaitlist(dto: WaitlistDto) {
        // Check if already on the waitlist
        const existing = await this.prisma.waitlist.findUnique({ where: { email: dto.email } });
        if (existing) {
            return { message: 'You are already on the waitlist!', alreadyJoined: true };
        }

        await this.prisma.waitlist.create({
            data: {
                email: dto.email,
                name: dto.name || null,
                source: dto.source || 'brand_feature',
            },
        });

        this.logger.log(`New waitlist signup: ${dto.email}`);
        return { message: 'Successfully joined the waitlist!', alreadyJoined: false };
    }

    // ========================================================================
    // ADMIN ENDPOINTS
    // ========================================================================

    /**
     * Get pending brand applications (admin)
     */
    async getPendingApplications(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [applications, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { brandVerificationStatus: 'PENDING' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    brandName: true,
                    brandWebsite: true,
                    brandInstagram: true,
                    brandTwitter: true,
                    brandLinkedin: true,
                    brandFacebook: true,
                    brandTiktok: true,
                    brandPhysicalAddress: true,
                    brandPhoneNumber: true,
                    brandWhatsApp: true,
                    brandApplicationNote: true,
                    brandProofUrls: true,
                    brandVerificationStatus: true,
                    createdAt: true,
                    profile: { select: { avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where: { brandVerificationStatus: 'PENDING' } }),
        ]);

        return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get all brand applications (admin) — any status
     */
    async getAllBrandApplications(status?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status && status !== 'all') {
            where.brandVerificationStatus = status;
        } else {
            where.brandVerificationStatus = { not: 'NONE' };
        }

        const [applications, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    brandName: true,
                    brandWebsite: true,
                    brandInstagram: true,
                    brandTwitter: true,
                    brandLinkedin: true,
                    brandFacebook: true,
                    brandTiktok: true,
                    brandPhysicalAddress: true,
                    brandPhoneNumber: true,
                    brandWhatsApp: true,
                    brandApplicationNote: true,
                    brandProofUrls: true,
                    brandVerificationStatus: true,
                    brandVerifiedAt: true,
                    brandRejectionReason: true,
                    createdAt: true,
                    profile: { select: { avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Approve a brand application (admin)
     */
    async approveBrand(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.brandVerificationStatus === 'VERIFIED_BRAND') {
            throw new BadRequestException('User is already a verified brand');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                brandVerificationStatus: 'VERIFIED_BRAND',
                brandVerifiedAt: new Date(),
                brandRejectionReason: null,
                isVerified: true, // Instantly unlock sell panel and other verified features
            },
        });

        // Send email notification to the user
        await this.emailService.send({
            to: user.email,
            subject: '✅ Your Brand Has Been Verified on BarterWave!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #D97706, #F59E0B); border-radius: 12px; padding: 30px; text-align: center; color: white;">
                        <span style="font-size: 48px;">✦</span>
                        <h2 style="margin: 10px 0;">Brand Verified!</h2>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Congratulations! <strong>${user.brandName || user.firstName || 'there'}</strong>, your brand has been verified on BarterWave.
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.6;">You now have access to:</p>
                    <ul style="color: #4B5563; line-height: 1.8;">
                        <li>✦ Verified Brand badge on all your listings</li>
                        <li>✦ Cash top-up and downpayment features</li>
                        <li>✦ Direct WhatsApp contact for buyers</li>
                        <li>✦ Private bank details dashboard</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/listings/create" 
                           style="background: linear-gradient(to right, #D97706, #F59E0B); 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Start Selling as a Verified Brand →
                        </a>
                    </div>
                </div>
            `,
            text: `Your brand "${user.brandName}" has been verified on BarterWave! You now have access to premium features.`,
        });

        // Create in-app notification
        await this.prisma.notification.create({
            data: {
                userId: user.id,
                type: 'VERIFICATION_APPROVED',
                data: {
                    message: 'Congratulations! Your brand has been verified.',
                    brandName: user.brandName,
                    approvedAt: new Date().toISOString(),
                },
            },
        });

        this.logger.log(`Brand approved: user ${userId} by admin ${adminId}`);
        return { message: 'Brand approved successfully' };
    }

    /**
     * Reject a brand application (admin)
     */
    async rejectBrand(userId: string, adminId: string, dto: BrandRejectDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                brandVerificationStatus: 'REJECTED',
                brandRejectionReason: dto.reason,
            },
        });

        // Send rejection email
        await this.emailService.send({
            to: user.email,
            subject: 'Brand Verification Update — BarterWave',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #DC2626;">Brand Verification Update</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${user.firstName ? ` ${user.firstName}` : ''}, unfortunately we couldn't verify your brand at this time.
                    </p>
                    
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="color: #DC2626; margin: 0; font-weight: bold;">Reason:</p>
                        <p style="color: #7F1D1D; margin: 8px 0 0 0;">${dto.reason}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        You can reapply once you've addressed the issues above.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/brand-apply" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reapply →
                        </a>
                    </div>
                </div>
            `,
            text: `Brand verification update: Your application was not approved. Reason: ${dto.reason}. Reapply at ${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/brand-apply`,
        });

        // Create in-app notification
        await this.prisma.notification.create({
            data: {
                userId: user.id,
                type: 'VERIFICATION_REJECTED',
                data: {
                    message: `Brand application rejected: ${dto.reason}`,
                    reason: dto.reason,
                    rejectedAt: new Date().toISOString(),
                    userEmail: user.email, // Helpful for linking if needed
                },
            },
        });

        this.logger.log(`Brand rejected: user ${userId} by admin ${adminId}. Reason: ${dto.reason}`);
        return { message: 'Brand rejected' };
    }

    /**
     * Revoke brand verification (admin)
     */
    async revokeBrand(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Allow revoking even if status is not strictly VERIFIED_BRAND (e.g. cleanup)
        // if (user.brandVerificationStatus !== 'VERIFIED_BRAND') {
        //    throw new BadRequestException('User is not a verified brand');
        // }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                brandVerificationStatus: 'NONE',
                brandVerifiedAt: null,
                isVerified: false, // CRITICAL: Remove verified status regarding sell panel access
            },
        });

        // Send revocation email
        await this.emailService.send({
            to: user.email,
            subject: '⚠️ Brand Verification Revoked — BarterWave',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #DC2626;">Brand Verification Revoked</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${user.firstName ? ` ${user.firstName}` : ''}, your brand verification status on BarterWave has been revoked by an administrator.
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        This means you no longer have access to verified brand features like the cash sell panel and verified badge.
                    </p>

                    <p style="color: #4B5563; line-height: 1.6;">
                        If you believe this is a mistake or have questions, please contact support.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="mailto:support@barterwave.com" 
                           style="background: #4B5563; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Contact Support →
                        </a>
                    </div>
                </div>
            `,
            text: `Your brand verification on BarterWave has been revoked. You no longer have access to verified features. Contact support if you believe this is an error.`,
        });

        // Create in-app notification
        await this.prisma.notification.create({
            data: {
                userId: user.id,
                type: 'admin_alert', // Using generic alert type for now as VERIFICATION_REVOKED might not exist in enum
                data: {
                    message: 'Your brand verification has been revoked.',
                    revokedAt: new Date().toISOString(),
                },
            },
        });

        this.logger.log(`Brand revoked: user ${userId} by admin ${adminId}`);
        return { message: 'Brand verification revoked' };
    }

    /**
     * Get waitlist entries (admin)
     */
    async getWaitlist(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [entries, total] = await Promise.all([
            this.prisma.waitlist.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.waitlist.count(),
        ]);

        return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get pending brands count (for admin sidebar badge)
     */
    async getPendingCount() {
        return this.prisma.user.count({ where: { brandVerificationStatus: 'PENDING' } });
    }

    // ========================================================================
    // ADMIN TOGGLE (direct brand verification without application)
    // ========================================================================

    async toggleBrandStatus(userId: string, adminId: string, verified: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                brandVerificationStatus: verified ? 'VERIFIED_BRAND' : 'NONE',
                brandVerifiedAt: verified ? new Date() : null,
            },
        });

        this.logger.log(`Brand status toggled for user ${userId}: ${verified ? 'VERIFIED' : 'REVOKED'} by admin ${adminId}`);
        return { message: `Brand ${verified ? 'verified' : 'revoked'} successfully` };
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    /**
     * Notify admin via email + in-app notification when a brand applies
     */
    private async notifyAdminOfApplication(userId: string, brandName: string, userEmail: string) {
        try {
            const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

            // 1. Send email to admin
            if (adminEmail) {
                await this.emailService.send({
                    to: adminEmail,
                    subject: `🔔 New Brand Application: ${brandName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #1E40AF; margin: 0;">BarterWave Admin</h1>
                            </div>
                            
                            <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px; text-align: center;">
                                <span style="font-size: 48px;">🔔</span>
                                <h2 style="color: #92400E; margin: 10px 0;">New Brand Application</h2>
                            </div>
                            
                            <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">Brand Name</p>
                                <p style="color: #1F2937; font-weight: bold; margin: 0 0 16px 0;">${brandName}</p>
                                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">Applicant Email</p>
                                <p style="color: #1F2937; margin: 0;">${userEmail}</p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${frontendUrl}/admin/brands" 
                                   style="background: #D97706; 
                                          color: white; 
                                          padding: 14px 28px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          font-weight: bold;
                                          display: inline-block;">
                                    Review Application →
                                </a>
                            </div>
                        </div>
                    `,
                    text: `New brand application from ${userEmail} (${brandName}). Review at ${frontendUrl}/admin/brands`,
                });
            } else {
                this.logger.warn('ADMIN_EMAIL not set — skipping brand application email alert');
            }

            // 2. Create in-app notification for all admin users
            // Check both legacy role field and RBAC userRole relation
            const admins = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'admin' },
                        { role: 'super_admin' },
                        { userRole: { name: { in: ['admin', 'super_admin'] } } },
                    ],
                },
                select: { id: true },
            });

            for (const admin of admins) {
                await this.prisma.notification.create({
                    data: {
                        userId: admin.id,
                        type: 'VERIFICATION_REQUEST',
                        data: {
                            brandName,
                            userEmail: userEmail, // Changed from applicantEmail to match frontend
                            applicantId: userId,
                            message: `New brand application: ${brandName}`,
                        },
                    },
                });
            }

            this.logger.log(`Admin notifications sent for brand application: ${brandName}`);
        } catch (error) {
            // Don't fail the application if notification fails
            this.logger.error(`Failed to send admin notification: ${error.message}`, error.stack);
        }
    }
}
