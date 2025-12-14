import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured = false;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        const smtpPort = this.configService.get<number>('SMTP_PORT');
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');

        this.logger.log(`SMTP Config: host=${smtpHost}, port=${smtpPort}, user=${smtpUser ? smtpUser.substring(0, 10) + '...' : 'MISSING'}`);

        if (!smtpHost || !smtpUser || !smtpPass) {
            this.logger.warn('Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment.');
            this.isConfigured = false;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            debug: true, // Enable debug output
            logger: true, // Log to console
        });

        // Verify connection
        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error(`❌ SMTP Connection Failed: ${error.message}`);
                this.isConfigured = false;
            } else {
                this.logger.log(`✅ SMTP Connection Verified - Ready to send emails`);
            }
        });

        this.isConfigured = true;
        this.logger.log(`✅ Email service configured successfully with ${smtpHost}:${smtpPort || 587}`);
    }

    async send(options: EmailOptions): Promise<boolean> {
        this.logger.log(`📧 Attempting to send email: "${options.subject}" to ${options.to}`);

        if (!this.isConfigured || !this.transporter) {
            this.logger.warn(`❌ Email not sent (not configured): ${options.subject} to ${options.to}`);
            // In development, log the email content for testing
            this.logger.debug(`Subject: ${options.subject}`);
            this.logger.debug(`To: ${options.to}`);
            this.logger.debug(`Body: ${options.text || 'HTML email'}`);
            return false;
        }

        const fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@BarterWave.com';
        const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'BarterWave';

        try {
            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });

            this.logger.log(`✅ Email sent successfully: ${options.subject} to ${options.to} (messageId: ${info.messageId})`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send email: ${error.message}`, error.stack);
            return false;
        }
    }

    // ========================================================================
    // TEMPLATE METHODS
    // ========================================================================

    async sendOtp(email: string, otp: string): Promise<boolean> {
        return this.send({
            to: email,
            subject: `Your BarterWave Verification Code: ${otp}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                        <p style="color: #64748B; font-size: 14px;">Email Verification</p>
                    </div>
                    
                    <h2 style="color: #1F2937; text-align: center;">Verify Your Email</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6; text-align: center;">
                        Use the following code to verify your email address:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; font-family: monospace;">
                            ${otp}
                        </span>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px; text-align: center;">
                        This code expires in <strong>10 minutes</strong>.
                    </p>
                    
                    <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="color: #92400E; margin: 0; font-size: 14px;">
                            ⚠️ If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} BarterWave. All rights reserved.
                    </p>
                </div>
            `,
            text: `Your BarterWave verification code is: ${otp}. This code expires in 10 minutes.`,
        });
    }

    async sendWelcome(email: string, name: string): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: email,
            subject: 'Welcome to BarterWave! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                        <p style="color: #64748B; font-size: 14px;">Buy, Sell, Barter</p>
                    </div>
                    
                    <h2 style="color: #1F2937;">Welcome${name ? `, ${name}` : ''}! 👋</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Thank you for joining BarterWave – Africa's marketplace for buying, selling, and bartering goods and services.
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        <strong>What's next?</strong>
                    </p>
                    
                    <ul style="color: #4B5563; line-height: 1.8;">
                        <li>Complete your profile to build trust</li>
                        <li>Verify your identity to unlock all features</li>
                        <li>Post your first listing or browse what's available</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/listings" 
                           style="background: linear-gradient(to right, #2563EB, #1D4ED8); 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Start Exploring →
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} BarterWave. All rights reserved.
                    </p>
                </div>
            `,
            text: `Welcome to BarterWave${name ? `, ${name}` : ''}! Start exploring at ${frontendUrl}/listings`,
        });
    }

    async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

        return this.send({
            to: email,
            subject: 'Reset Your BarterWave Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #1F2937;">Password Reset Request</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background: #DC2626; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        If the button doesn't work, copy this link: ${resetLink}
                    </p>
                </div>
            `,
            text: `Reset your BarterWave password: ${resetLink}. This link expires in 1 hour.`,
        });
    }

    async sendVerificationApproved(email: string, name: string): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: email,
            subject: '✅ Your BarterWave Account is Verified!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 64px;">✅</span>
                    </div>
                    
                    <h2 style="color: #059669; text-align: center;">Congratulations${name ? `, ${name}` : ''}!</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6; text-align: center;">
                        Your identity has been verified. You now have full access to all BarterWave features:
                    </p>
                    
                    <ul style="color: #4B5563; line-height: 1.8;">
                        <li>✓ Verified seller badge on your listings</li>
                        <li>✓ Priority in search results</li>
                        <li>✓ Access to barter exchanges</li>
                        <li>✓ Escrow-protected distress sales</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/listings/create" 
                           style="background: #059669; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Post Your First Listing →
                        </a>
                    </div>
                </div>
            `,
            text: `Congratulations${name ? `, ${name}` : ''}! Your BarterWave account is now verified.`,
        });
    }

    async sendVerificationRejected(email: string, name: string, reason: string): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: email,
            subject: 'BarterWave Verification Update',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #DC2626;">Verification Update</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${name ? ` ${name}` : ''}, unfortunately we couldn't verify your identity at this time.
                    </p>
                    
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="color: #DC2626; margin: 0; font-weight: bold;">Reason:</p>
                        <p style="color: #7F1D1D; margin: 8px 0 0 0;">${reason}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        You can resubmit your verification documents. Please ensure:
                    </p>
                    
                    <ul style="color: #4B5563; line-height: 1.8;">
                        <li>Photos are clear and well-lit</li>
                        <li>All document corners are visible</li>
                        <li>Information is readable</li>
                        <li>Selfie matches the ID photo</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/verification" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Resubmit Verification
                        </a>
                    </div>
                </div>
            `,
            text: `Hi${name ? ` ${name}` : ''}, your BarterWave verification was not approved. Reason: ${reason}. Please resubmit at ${frontendUrl}/verification`,
        });
    }

    async sendEscrowPaymentReceived(
        sellerEmail: string,
        sellerName: string,
        buyerName: string,
        itemTitle: string,
        amount: number,
        currency: string,
    ): Promise<boolean> {
        return this.send({
            to: sellerEmail,
            subject: `💰 Payment Secured: ${itemTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 20px; text-align: center;">
                        <span style="font-size: 48px;">💰</span>
                        <h2 style="color: #059669; margin: 10px 0;">Payment Secured!</h2>
                        <p style="color: #065F46; font-size: 24px; font-weight: bold; margin: 0;">
                            ${currency} ${amount.toLocaleString()}
                        </p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Hi${sellerName ? ` ${sellerName}` : ''}, great news! <strong>${buyerName}</strong> has paid for:
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #1F2937; font-weight: bold; margin: 0;">${itemTitle}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        <strong>What's next?</strong><br>
                        The funds are held securely in escrow. You can now safely meet the buyer. 
                        Once they confirm receipt, you'll receive your payment instantly!
                    </p>
                    
                    <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="color: #92400E; margin: 0; font-size: 14px;">
                            ⚠️ Do NOT give the item until you've met the buyer in person. The buyer will enter a confirmation code to release your payment.
                        </p>
                    </div>
                </div>
            `,
            text: `Payment secured for ${itemTitle}! ${currency} ${amount.toLocaleString()} from ${buyerName}. Meet the buyer safely - funds will be released when they confirm receipt.`,
        });
    }

    async sendEscrowReleased(
        sellerEmail: string,
        sellerName: string,
        itemTitle: string,
        amount: number,
        currency: string,
    ): Promise<boolean> {
        return this.send({
            to: sellerEmail,
            subject: `🎉 Payment Released: ${currency} ${amount.toLocaleString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #059669, #10B981); border-radius: 12px; padding: 30px; text-align: center; color: white;">
                        <span style="font-size: 48px;">🎉</span>
                        <h2 style="margin: 10px 0;">Payment Released!</h2>
                        <p style="font-size: 32px; font-weight: bold; margin: 0;">
                            ${currency} ${amount.toLocaleString()}
                        </p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Hi${sellerName ? ` ${sellerName}` : ''}, the buyer has confirmed receipt of:
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #1F2937; font-weight: bold; margin: 0;">${itemTitle}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Your payment has been processed and will be in your account shortly. 
                        Thank you for selling on BarterWave!
                    </p>
                </div>
            `,
            text: `Payment released! ${currency} ${amount.toLocaleString()} for ${itemTitle} has been sent to your account.`,
        });
    }

    // ========================================================================
    // OFFER NOTIFICATION TEMPLATES
    // ========================================================================

    async sendNewOffer(
        sellerEmail: string,
        sellerName: string,
        buyerName: string,
        listingTitle: string,
        offerDetails: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: sellerEmail,
            subject: `🔔 New Offer on "${listingTitle}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: #EEF2FF; border-radius: 12px; padding: 20px; text-align: center;">
                        <span style="font-size: 48px;">📬</span>
                        <h2 style="color: #4338CA; margin: 10px 0;">You've Got an Offer!</h2>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Hi${sellerName ? ` ${sellerName}` : ''}, <strong>${buyerName}</strong> is interested in your listing:
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #1F2937; font-weight: bold; margin: 0 0 8px 0;">${listingTitle}</p>
                        <p style="color: #6B7280; margin: 0; font-size: 14px;">${offerDetails}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/offers" 
                           style="background: linear-gradient(to right, #4F46E5, #7C3AED); 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            View Offer →
                        </a>
                    </div>
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        Don't miss out – respond quickly to close the deal!
                    </p>
                </div>
            `,
            text: `New offer from ${buyerName} on "${listingTitle}": ${offerDetails}. View at ${frontendUrl}/offers`,
        });
    }

    async sendOfferAccepted(
        buyerEmail: string,
        buyerName: string,
        sellerName: string,
        listingTitle: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: buyerEmail,
            subject: `✅ Your Offer Was Accepted!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #10B981, #059669); border-radius: 12px; padding: 30px; text-align: center; color: white;">
                        <span style="font-size: 48px;">🎉</span>
                        <h2 style="margin: 10px 0;">Offer Accepted!</h2>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Great news${buyerName ? `, ${buyerName}` : ''}! <strong>${sellerName}</strong> has accepted your offer on:
                    </p>
                    
                    <div style="background: #F0FDF4; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #166534; font-weight: bold; margin: 0;">${listingTitle}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        <strong>What's next?</strong> Message the seller to arrange the exchange!
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/offers" 
                           style="background: #059669; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Continue to Offer →
                        </a>
                    </div>
                </div>
            `,
            text: `Your offer on "${listingTitle}" was accepted by ${sellerName}! Visit ${frontendUrl}/offers to continue.`,
        });
    }

    async sendOfferRejected(
        buyerEmail: string,
        buyerName: string,
        listingTitle: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: buyerEmail,
            subject: `Offer Update: ${listingTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #4B5563;">Offer Not Accepted</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${buyerName ? ` ${buyerName}` : ''}, unfortunately the seller declined your offer on:
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #1F2937; font-weight: bold; margin: 0;">${listingTitle}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Don't worry – there are plenty of other great deals on BarterWave!
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/listings" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Browse More Listings →
                        </a>
                    </div>
                </div>
            `,
            text: `Your offer on "${listingTitle}" was not accepted. Browse more listings at ${frontendUrl}/listings`,
        });
    }

    async sendCounterOffer(
        buyerEmail: string,
        buyerName: string,
        sellerName: string,
        listingTitle: string,
        counterDetails: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: buyerEmail,
            subject: `↩️ Counter Offer on "${listingTitle}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 20px; text-align: center;">
                        <span style="font-size: 48px;">↩️</span>
                        <h2 style="color: #92400E; margin: 10px 0;">Counter Offer Received</h2>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Hi${buyerName ? ` ${buyerName}` : ''}, <strong>${sellerName}</strong> made a counter offer on:
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #1F2937; font-weight: bold; margin: 0 0 8px 0;">${listingTitle}</p>
                        <p style="color: #6B7280; margin: 0; font-size: 14px;">${counterDetails}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/offers" 
                           style="background: #D97706; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Review Counter Offer →
                        </a>
                    </div>
                </div>
            `,
            text: `Counter offer from ${sellerName} on "${listingTitle}": ${counterDetails}. Review at ${frontendUrl}/offers`,
        });
    }

    // ========================================================================
    // MESSAGE & ORDER TEMPLATES
    // ========================================================================

    async sendNewMessage(
        recipientEmail: string,
        recipientName: string,
        senderName: string,
        messagePreview: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: recipientEmail,
            subject: `💬 New message from ${senderName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #1F2937;">New Message</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${recipientName ? ` ${recipientName}` : ''}, you have a new message from <strong>${senderName}</strong>:
                    </p>
                    
                    <div style="background: #F3F4F6; border-left: 4px solid #2563EB; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                        <p style="color: #4B5563; margin: 0; font-style: italic;">"${messagePreview}"</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/messages" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reply Now →
                        </a>
                    </div>
                </div>
            `,
            text: `New message from ${senderName}: "${messagePreview}". Reply at ${frontendUrl}/messages`,
        });
    }

    async sendOrderConfirmation(
        buyerEmail: string,
        buyerName: string,
        orderNumber: string,
        itemTitle: string,
        amount: number,
        currency: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: buyerEmail,
            subject: `🛒 Order Confirmed: ${orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border-radius: 12px; padding: 30px; text-align: center; color: white;">
                        <span style="font-size: 48px;">✅</span>
                        <h2 style="margin: 10px 0;">Order Confirmed!</h2>
                        <p style="font-size: 14px; opacity: 0.9; margin: 0;">Order #${orderNumber}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Thank you${buyerName ? `, ${buyerName}` : ''}! Your order has been confirmed.
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">Item</p>
                        <p style="color: #1F2937; font-weight: bold; margin: 0;">${itemTitle}</p>
                        <p style="color: #059669; font-size: 18px; font-weight: bold; margin: 8px 0 0 0;">
                            ${currency} ${amount.toLocaleString()}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/history" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            View Order Details →
                        </a>
                    </div>
                </div>
            `,
            text: `Order #${orderNumber} confirmed! ${itemTitle} - ${currency} ${amount.toLocaleString()}. View at ${frontendUrl}/history`,
        });
    }

    async sendRoleAssigned(
        email: string,
        name: string,
        roleName: string,
        description: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: email,
            subject: `🎉 You've been promoted to ${roleName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #7C3AED, #6D28D9); border-radius: 12px; padding: 30px; text-align: center; color: white;">
                        <span style="font-size: 48px;">🌟</span>
                        <h2 style="margin: 10px 0;">New Role Assigned!</h2>
                        <p style="font-size: 24px; font-weight: bold; margin: 0;">
                            ${roleName}
                        </p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Congratulations${name ? `, ${name}` : ''}! You have been appointed as <strong>${roleName}</strong>.
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">Role Capabilities</p>
                        <p style="color: #1F2937; margin: 0;">${description}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        You now have access to additional features and responsibilities on the platform.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/admin" 
                           style="background: #7C3AED; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Access Admin Panel →
                        </a>
                    </div>
                </div>
            `,
            text: `Congratulations! You've been appointed as ${roleName}. ${description}. Access your dashboard at ${frontendUrl}/admin`,
        });
    }

    async sendRoleRemoved(
        email: string,
        name: string,
        previousRole: string,
    ): Promise<boolean> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        return this.send({
            to: email,
            subject: 'Role Update Notification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <h2 style="color: #4B5563;">Role Update</h2>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Hi${name ? ` ${name}` : ''},
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Your <strong>${previousRole}</strong> role has been removed. You are now a regular user on BarterWave.
                    </p>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        Thank you for your contributions in your previous role. You can still buy, sell, and trade as a verified member.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}" 
                           style="background: #2563EB; 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Return to Marketplace
                        </a>
                    </div>
                </div>
            `,
            text: `Role Update: Your ${previousRole} role has been removed. You are now a regular user.`,
        });
    }

    async sendAccountSuspended(
        email: string,
        name: string,
        reason: string,
    ): Promise<boolean> {
        return this.send({
            to: email,
            subject: '⚠️ BarterWave Account Status Update',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E40AF; margin: 0;">BarterWave</h1>
                    </div>
                    
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; text-align: center;">
                        <span style="font-size: 48px;">⚠️</span>
                        <h2 style="color: #DC2626; margin: 10px 0;">Account Suspended</h2>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6; margin-top: 20px;">
                        Hi${name ? ` ${name}` : ''}, your BarterWave account has been suspended.
                    </p>
                    
                    <div style="background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="color: #DC2626; font-weight: bold; margin: 0 0 8px 0;">Reason:</p>
                        <p style="color: #7F1D1D; margin: 0;">${reason}</p>
                    </div>
                    
                    <p style="color: #4B5563; line-height: 1.6;">
                        If you believe this is a mistake, please contact our support team to appeal this decision.
                    </p>
                    
                    <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">
                        © ${new Date().getFullYear()} BarterWave. All rights reserved.
                    </p>
                </div>
            `,
            text: `Your BarterWave account has been suspended. Reason: ${reason}. Contact support if you believe this is a mistake.`,
        });
    }
}
