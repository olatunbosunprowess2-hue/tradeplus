import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubscriptionSchedulerService {
    private readonly logger = new Logger(SubscriptionSchedulerService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Runs EVERY HOUR to check and downgrade expired premium subscriptions
     * Processes up to 50 users per run to prevent database spikes
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiredSubscriptions() {
        this.logger.log('⏰ [SUBSCRIPTION CHECK] Starting hourly subscription expiry check...');

        const now = new Date();

        // Find expired subscriptions that are still active (batch of 50)
        const expiredSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: 'active',
                expiresAt: { lt: now },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        tier: true,
                    },
                },
            },
            take: 50, // Process max 50 per hour to prevent spikes
        });

        if (expiredSubscriptions.length === 0) {
            this.logger.log('✅ [SUBSCRIPTION CHECK] No expired subscriptions found.');
            return;
        }

        this.logger.log(`🔄 [SUBSCRIPTION CHECK] Found ${expiredSubscriptions.length} expired subscription(s). Processing batch...`);

        let downgradeCount = 0;

        for (const subscription of expiredSubscriptions) {
            try {
                // Downgrade user to free tier
                await this.prisma.$transaction([
                    // Update user tier back to free
                    this.prisma.user.update({
                        where: { id: subscription.userId },
                        data: { tier: 'free' },
                    }),
                    // Mark subscription as expired
                    this.prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'expired' },
                    }),
                ]);

                downgradeCount++;

                // Send expiry notification email
                const userName = subscription.user.firstName || 'User';
                await this.emailService.send({
                    to: subscription.user.email,
                    subject: '📅 Your BarterWave Premium Subscription Has Expired',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                            </div>
                            
                            <h2 style="color: #4B5563;">Your Premium Subscription Has Ended</h2>
                            
                            <p style="color: #4B5563; line-height: 1.6;">
                                Hi ${userName}, your BarterWave Premium subscription has expired.
                            </p>
                            
                            <p style="color: #4B5563; line-height: 1.6;">
                                <strong>What changes:</strong>
                            </p>
                            
                            <ul style="color: #4B5563; line-height: 1.8;">
                                <li>Listing limit returns to 5 active listings</li>
                                <li>Daily chat limit returns to 3 new chats</li>
                                <li>Premium badge removed from your listings</li>
                                <li>Aggressive Boost discount no longer applies</li>
                            </ul>
                            
                            <p style="color: #4B5563; line-height: 1.6;">
                                Want to keep enjoying Premium benefits? Renew anytime!
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="\${process.env.FRONTEND_URL || 'http://localhost:3000'}/premium" 
                                   style="background: linear-gradient(135deg, #F59E0B, #D97706); 
                                          color: white; 
                                          padding: 14px 28px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          font-weight: bold;
                                          display: inline-block;">
                                    Renew Premium →
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                            
                            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                                © ${new Date().getFullYear()} BarterWave. All rights reserved.
                            </p>
                        </div>
                    `,
                    text: `Hi ${userName}, your BarterWave Premium subscription has expired. Renew anytime to get unlimited listings, chats, and premium benefits.`,
                });

                this.logger.log(`   ✅ Downgraded user: ${subscription.user.email}`);
            } catch (error) {
                this.logger.error(`   ❌ Failed to downgrade user ${subscription.user.email}: ${error.message}`);
            }
        }

        this.logger.log(`🎯 [SUBSCRIPTION CHECK] Complete. Downgraded ${downgradeCount}/${expiredSubscriptions.length} subscriptions.`);
    }

    /**
     * Send reminder emails 3 days before expiry
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async sendExpiryReminders() {
        this.logger.log('📬 [EXPIRY REMINDER] Checking for subscriptions expiring soon...');

        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Find subscriptions expiring in 3 days
        const expiringSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: 'active',
                expiresAt: {
                    gte: now,
                    lte: threeDaysFromNow,
                },
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                    },
                },
            },
        });

        if (expiringSubscriptions.length === 0) {
            this.logger.log('✅ [EXPIRY REMINDER] No subscriptions expiring in the next 3 days.');
            return;
        }

        for (const subscription of expiringSubscriptions) {
            const expiryDate = subscription.expiresAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            await this.emailService.send({
                to: subscription.user.email,
                subject: '⚠️ Your Premium Subscription Expires Soon',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                        </div>
                        
                        <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px; text-align: center;">
                            <span style="font-size: 48px;">⚠️</span>
                            <h2 style="color: #92400E; margin: 10px 0;">Subscription Expiring Soon</h2>
                            <p style="color: #92400E; font-weight: bold; margin: 0;">Expires on ${expiryDate}</p>
                        </div>
                        
                        <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                            Hi ${subscription.user.firstName || 'there'}, your Premium subscription is expiring soon.
                        </p>
                        
                        <p style="color: #4B5563; line-height: 1.6;">
                            Renew now to keep enjoying unlimited listings, unlimited chats, and your Premium badge!
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="\${process.env.FRONTEND_URL || 'http://localhost:3000'}/premium" 
                               style="background: linear-gradient(135deg, #7C3AED, #6D28D9); 
                                      color: white; 
                                      padding: 14px 28px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Renew Premium →
                            </a>
                        </div>
                    </div>
                `,
                text: `Hi ${subscription.user.firstName || 'there'}, your Premium subscription expires on ${expiryDate}. Renew now to keep your premium benefits.`,
            });

            this.logger.log(`   📧 Sent expiry reminder to: ${subscription.user.email}`);
        }

        this.logger.log(`📬 [EXPIRY REMINDER] Sent ${expiringSubscriptions.length} reminder(s).`);
    }
}
