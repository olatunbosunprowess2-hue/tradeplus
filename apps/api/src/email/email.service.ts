import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfrastructureService } from '../infrastructure/infrastructure.service';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private configService: ConfigService,
        private infrastructureService: InfrastructureService
    ) { }

    async send(options: EmailOptions): Promise<boolean> {
        return this.infrastructureService.sendEmail(options);
    }

    // ========================================================================
    // SHARED LAYOUT WRAPPER
    // ========================================================================

    private get frontendUrl(): string {
        return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    private get year(): number {
        return new Date().getFullYear();
    }

    /**
     * Professional email layout wrapper with consistent BarterWave branding.
     * Uses a clean, modern design with proper spacing, typography, and responsive width.
     */
    private wrapLayout(content: string, preheader?: string): string {
        return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>BarterWave</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b2948 0%, #1a5ba8 50%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Logo mark -->
                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: inline-block; line-height: 48px; margin-bottom: 8px;">
                      <span style="font-size: 24px; color: #ffffff; font-weight: 800;">B</span>
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">BarterWave</h1>
                    <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.7); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500;">Africa's Trusted Marketplace</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                      <a href="${this.frontendUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Visit BarterWave</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${this.frontendUrl}/terms" style="color: #6b7280; text-decoration: none;">Terms</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${this.frontendUrl}/privacy" style="color: #6b7280; text-decoration: none;">Privacy</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      © ${this.year} BarterWave Technologies. All rights reserved.
                    </p>
                    <p style="margin: 6px 0 0; font-size: 11px; color: #d1d5db;">
                      Lagos, Nigeria • Connecting Africa through trade
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    /**
     * Generates a styled CTA button.
     */
    private ctaButton(text: string, href: string, color: string = '#2563eb'): string {
        return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 24px 0 8px;">
              <a href="${href}" target="_blank" style="
                display: inline-block;
                background: ${color};
                color: #ffffff;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 15px;
                letter-spacing: -0.01em;
                mso-padding-alt: 14px 32px;
              ">${text}</a>
            </td>
          </tr>
        </table>`;
    }

    /**
     * Generates a highlight box (for OTP codes, amounts, statuses).
     */
    private highlightBox(content: string, bgColor: string = '#f0f4ff', borderColor: string = '#c7d2fe'): string {
        return `
        <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          ${content}
        </div>`;
    }

    /**
     * Generates a detail card for items/listings.
     */
    private detailCard(label: string, value: string, extra?: string): string {
        return `
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #2563eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${label}</p>
          <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0;">${value}</p>
          ${extra ? `<p style="color: #6b7280; font-size: 14px; margin: 6px 0 0;">${extra}</p>` : ''}
        </div>`;
    }

    /**
     * Generates a warning/info callout box.
     */
    private callout(text: string, type: 'warning' | 'info' | 'danger' | 'success' = 'warning'): string {
        const styles = {
            warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚠️' },
            info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' },
            danger: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '🚨' },
            success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
        };
        const s = styles[type];
        return `
        <div style="background: ${s.bg}; border: 1px solid ${s.border}; border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
          <p style="color: ${s.text}; margin: 0; font-size: 14px; line-height: 1.5;">${s.icon} ${text}</p>
        </div>`;
    }

    // ========================================================================
    // TEMPLATE METHODS
    // ========================================================================

    async sendOtp(email: string, otp: string): Promise<boolean> {
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center;">Verify Your Email</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Enter the code below to complete your email verification.
            </p>

            ${this.highlightBox(`
                <p style="font-size: 11px; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</p>
                <p style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #0b2948; font-family: 'Courier New', monospace; margin: 0;">${otp}</p>
            `, '#f0f4ff', '#c7d2fe')}

            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
                This code expires in <strong style="color: #6b7280;">10 minutes</strong>.
            </p>

            ${this.callout("If you didn't request this code, you can safely ignore this email. No changes will be made to your account.")}
        `;

        return this.send({
            to: email,
            subject: `${otp} is your BarterWave verification code`,
            html: this.wrapLayout(content, `Your verification code is ${otp}`),
            text: `Your BarterWave verification code is: ${otp}. This code expires in 10 minutes.`,
        });
    }

    async sendWelcome(email: string, name: string): Promise<boolean> {
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Welcome to BarterWave${name ? `, ${name}` : ''}! 👋</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                You've joined Africa's fastest-growing marketplace for buying, selling, and bartering goods. Here's how to get started:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">1</div>
                      </td>
                      <td style="padding-left: 12px; vertical-align: top;">
                        <p style="color: #111827; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Complete your profile</p>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">Add a photo and bio to build trust with buyers and sellers.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">2</div>
                      </td>
                      <td style="padding-left: 12px; vertical-align: top;">
                        <p style="color: #111827; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Verify your identity</p>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">Get the verified badge and unlock all platform features.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">3</div>
                      </td>
                      <td style="padding-left: 12px; vertical-align: top;">
                        <p style="color: #111827; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Post your first listing</p>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">Start selling, buying, or bartering with the community.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${this.ctaButton('Start Exploring →', `${this.frontendUrl}/listings`)}
        `;

        return this.send({
            to: email,
            subject: 'Welcome to BarterWave — let\'s get started! 🎉',
            html: this.wrapLayout(content, `Welcome to BarterWave${name ? `, ${name}` : ''}!`),
            text: `Welcome to BarterWave${name ? `, ${name}` : ''}! Start exploring at ${this.frontendUrl}/listings`,
        });
    }

    async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
        const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center;">Reset Your Password</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                We received a request to reset your password. Click the button below to create a new one.
            </p>

            ${this.ctaButton('Reset Password', resetLink, '#dc2626')}

            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 16px 0 0;">
                This link expires in <strong>1 hour</strong>.
            </p>

            ${this.callout("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.")}

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0; word-break: break-all;">
                Can't click the button? Copy this link:<br>
                <a href="${resetLink}" style="color: #2563eb; text-decoration: underline; font-size: 11px;">${resetLink}</a>
            </p>
        `;

        return this.send({
            to: email,
            subject: 'Reset your BarterWave password',
            html: this.wrapLayout(content, 'Reset your password — this link expires in 1 hour.'),
            text: `Reset your BarterWave password: ${resetLink}. This link expires in 1 hour.`,
        });
    }

    async sendVerificationApproved(email: string, name: string): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
                <h2 style="color: #059669; font-size: 22px; font-weight: 700; margin: 0;">Identity Verified!</h2>
            `, '#f0fdf4', '#a7f3d0')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                Congratulations${name ? `, ${name}` : ''}! Your identity has been verified. You now have full access to all premium features:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
              <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">✓ &nbsp; Verified seller badge on all your listings</td></tr>
              <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">✓ &nbsp; Priority placement in search results</td></tr>
              <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">✓ &nbsp; Access to barter exchange system</td></tr>
              <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">✓ &nbsp; Escrow-protected distress sales</td></tr>
            </table>

            ${this.ctaButton('Post Your First Listing →', `${this.frontendUrl}/listings/create`, '#059669')}
        `;

        return this.send({
            to: email,
            subject: '✅ Your BarterWave account is now verified!',
            html: this.wrapLayout(content, `Your BarterWave identity has been verified.`),
            text: `Congratulations${name ? `, ${name}` : ''}! Your BarterWave account is now verified.`,
        });
    }

    async sendVerificationRejected(email: string, name: string, reason: string): Promise<boolean> {
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Verification Update</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Hi${name ? ` ${name}` : ''}, unfortunately we couldn't verify your identity at this time.
            </p>

            ${this.highlightBox(`
                <p style="color: #991b1b; font-weight: 600; margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
            `, '#fef2f2', '#fecaca')}

            <p style="color: #4b5563; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Before resubmitting, please ensure:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
              <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">• Photos are clear and well-lit</td></tr>
              <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">• All document corners are visible</td></tr>
              <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">• Text and information are readable</td></tr>
              <tr><td style="padding: 6px 0; color: #4b5563; font-size: 14px;">• Selfie matches the ID photo</td></tr>
            </table>

            ${this.ctaButton('Resubmit Verification →', `${this.frontendUrl}/verification`)}
        `;

        return this.send({
            to: email,
            subject: 'BarterWave — Verification update',
            html: this.wrapLayout(content, `Verification update — action required.`),
            text: `Hi${name ? ` ${name}` : ''}, your BarterWave verification was not approved. Reason: ${reason}. Please resubmit at ${this.frontendUrl}/verification`,
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
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">💰</div>
                <p style="color: #059669; font-size: 13px; font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Payment Secured in Escrow</p>
                <p style="color: #065f46; font-size: 32px; font-weight: 800; margin: 0;">${currency} ${amount.toLocaleString()}</p>
            `, '#ecfdf5', '#a7f3d0')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${sellerName ? ` ${sellerName}` : ''}, great news! <strong>${buyerName}</strong> has made a payment for:
            </p>

            ${this.detailCard('Item', itemTitle)}

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 16px 0;">
                <strong>What's next?</strong> The funds are held securely in escrow. You can now safely meet the buyer. Once they confirm receipt, the payment will be released to you instantly.
            </p>

            ${this.callout("Do NOT hand over the item until you've met the buyer in person. They will enter a confirmation code to release your payment.", 'warning')}
        `;

        return this.send({
            to: sellerEmail,
            subject: `💰 Payment secured: ${itemTitle}`,
            html: this.wrapLayout(content, `${buyerName} paid ${currency} ${amount.toLocaleString()} for ${itemTitle}`),
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
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
                <p style="color: #ffffff; font-size: 13px; font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Payment Released</p>
                <p style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 0;">${currency} ${amount.toLocaleString()}</p>
            `.replace('color: #ffffff', 'color: #065f46'), '#ecfdf5', '#a7f3d0')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${sellerName ? ` ${sellerName}` : ''}, the buyer has confirmed receipt of:
            </p>

            ${this.detailCard('Item Delivered', itemTitle, `${currency} ${amount.toLocaleString()}`)}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 16px 0 0;">
                Your payment has been processed and will be in your account shortly. Thank you for selling on BarterWave!
            </p>

            ${this.callout('Your funds are on their way. Processing typically takes 1–2 business days.', 'success')}
        `;

        return this.send({
            to: sellerEmail,
            subject: `🎉 Payment released: ${currency} ${amount.toLocaleString()}`,
            html: this.wrapLayout(content, `Your payment of ${currency} ${amount.toLocaleString()} has been released.`),
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
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">📬</div>
                <h2 style="color: #4338ca; font-size: 20px; font-weight: 700; margin: 0;">You've Got an Offer!</h2>
            `, '#eef2ff', '#c7d2fe')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${sellerName ? ` ${sellerName}` : ''}, <strong>${buyerName}</strong> is interested in your listing:
            </p>

            ${this.detailCard('Listing', listingTitle, offerDetails)}

            ${this.ctaButton('View Offer →', `${this.frontendUrl}/offers`, 'linear-gradient(135deg, #4f46e5, #7c3aed)')}

            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 4px 0 0;">
                Respond quickly to close the deal!
            </p>
        `;

        return this.send({
            to: sellerEmail,
            subject: `📬 New offer on "${listingTitle}"`,
            html: this.wrapLayout(content, `${buyerName} made an offer on ${listingTitle}`),
            text: `New offer from ${buyerName} on "${listingTitle}": ${offerDetails}. View at ${this.frontendUrl}/offers`,
        });
    }

    async sendOfferAccepted(
        buyerEmail: string,
        buyerName: string,
        sellerName: string,
        listingTitle: string,
    ): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
                <h2 style="color: #059669; font-size: 20px; font-weight: 700; margin: 0;">Offer Accepted!</h2>
            `, '#f0fdf4', '#a7f3d0')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Great news${buyerName ? `, ${buyerName}` : ''}! <strong>${sellerName}</strong> has accepted your offer on:
            </p>

            ${this.detailCard('Listing', listingTitle)}

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 16px 0 0;">
                <strong>What's next?</strong> Message the seller to arrange the exchange!
            </p>

            ${this.ctaButton('Continue to Offer →', `${this.frontendUrl}/offers`, '#059669')}
        `;

        return this.send({
            to: buyerEmail,
            subject: `✅ Your offer on "${listingTitle}" was accepted!`,
            html: this.wrapLayout(content, `${sellerName} accepted your offer on ${listingTitle}`),
            text: `Your offer on "${listingTitle}" was accepted by ${sellerName}! Visit ${this.frontendUrl}/offers to continue.`,
        });
    }

    async sendOfferRejected(
        buyerEmail: string,
        buyerName: string,
        listingTitle: string,
    ): Promise<boolean> {
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Offer Update</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${buyerName ? ` ${buyerName}` : ''}, unfortunately the seller declined your offer on:
            </p>

            ${this.detailCard('Listing', listingTitle)}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 16px 0 0;">
                Don't worry — there are plenty of other great deals on BarterWave!
            </p>

            ${this.ctaButton('Browse More Listings →', `${this.frontendUrl}/listings`)}
        `;

        return this.send({
            to: buyerEmail,
            subject: `Offer update: ${listingTitle}`,
            html: this.wrapLayout(content, `Your offer on "${listingTitle}" was not accepted.`),
            text: `Your offer on "${listingTitle}" was not accepted. Browse more listings at ${this.frontendUrl}/listings`,
        });
    }

    async sendCounterOffer(
        buyerEmail: string,
        buyerName: string,
        sellerName: string,
        listingTitle: string,
        counterDetails: string,
    ): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">↩️</div>
                <h2 style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0;">Counter Offer Received</h2>
            `, '#fffbeb', '#fde68a')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${buyerName ? ` ${buyerName}` : ''}, <strong>${sellerName}</strong> made a counter offer on:
            </p>

            ${this.detailCard('Listing', listingTitle, counterDetails)}

            ${this.ctaButton('Review Counter Offer →', `${this.frontendUrl}/offers`, '#d97706')}
        `;

        return this.send({
            to: buyerEmail,
            subject: `↩️ Counter offer on "${listingTitle}"`,
            html: this.wrapLayout(content, `${sellerName} sent a counter offer on "${listingTitle}"`),
            text: `Counter offer from ${sellerName} on "${listingTitle}": ${counterDetails}. Review at ${this.frontendUrl}/offers`,
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
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 16px;">New Message</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Hi${recipientName ? ` ${recipientName}` : ''}, you have a new message from <strong>${senderName}</strong>:
            </p>

            <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 16px 0; border-radius: 0 10px 10px 0;">
              <p style="color: #4b5563; margin: 0; font-size: 15px; font-style: italic; line-height: 1.6;">"${messagePreview}"</p>
            </div>

            ${this.ctaButton('Reply Now →', `${this.frontendUrl}/messages`)}
        `;

        return this.send({
            to: recipientEmail,
            subject: `💬 New message from ${senderName}`,
            html: this.wrapLayout(content, `${senderName}: "${messagePreview}"`),
            text: `New message from ${senderName}: "${messagePreview}". Reply at ${this.frontendUrl}/messages`,
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
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
                <h2 style="color: #1e40af; font-size: 20px; font-weight: 700; margin: 0 0 4px;">Order Confirmed</h2>
                <p style="color: #6b7280; font-size: 13px; margin: 0;">Order #${orderNumber}</p>
            `, '#eff6ff', '#bfdbfe')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Thank you${buyerName ? `, ${buyerName}` : ''}! Your order has been confirmed.
            </p>

            <div style="background: #f9fafb; border-radius: 10px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #059669;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Item</p>
              <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 6px;">${itemTitle}</p>
              <p style="color: #059669; font-size: 20px; font-weight: 800; margin: 0;">${currency} ${amount.toLocaleString()}</p>
            </div>

            ${this.ctaButton('View Order Details →', `${this.frontendUrl}/history`)}
        `;

        return this.send({
            to: buyerEmail,
            subject: `🛒 Order confirmed: #${orderNumber}`,
            html: this.wrapLayout(content, `Order #${orderNumber} confirmed — ${itemTitle}`),
            text: `Order #${orderNumber} confirmed! ${itemTitle} - ${currency} ${amount.toLocaleString()}. View at ${this.frontendUrl}/history`,
        });
    }

    async sendRoleAssigned(
        email: string,
        name: string,
        roleName: string,
        description: string,
    ): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">🌟</div>
                <p style="color: #6d28d9; font-size: 13px; font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">New Role Assigned</p>
                <p style="color: #4c1d95; font-size: 24px; font-weight: 800; margin: 0;">${roleName}</p>
            `, '#f5f3ff', '#ddd6fe')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Congratulations${name ? `, ${name}` : ''}! You have been appointed as <strong>${roleName}</strong>.
            </p>

            ${this.detailCard('Role Capabilities', description)}

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 16px 0 0;">
                You now have access to additional features and responsibilities on the platform.
            </p>

            ${this.ctaButton('Access Admin Panel →', `${this.frontendUrl}/admin`, '#7c3aed')}
        `;

        return this.send({
            to: email,
            subject: `🌟 You've been promoted to ${roleName}`,
            html: this.wrapLayout(content, `You've been appointed as ${roleName} on BarterWave.`),
            text: `Congratulations! You've been appointed as ${roleName}. ${description}. Access your dashboard at ${this.frontendUrl}/admin`,
        });
    }

    async sendRoleRemoved(
        email: string,
        name: string,
        previousRole: string,
    ): Promise<boolean> {
        const content = `
            <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Role Update</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${name ? ` ${name}` : ''}, your <strong>${previousRole}</strong> role has been removed. You are now a regular member on BarterWave.
            </p>

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 16px 0 0;">
                Thank you for your contributions in your previous role. You can still buy, sell, and trade as a verified member.
            </p>

            ${this.ctaButton('Return to Marketplace', `${this.frontendUrl}`)}
        `;

        return this.send({
            to: email,
            subject: 'Role update notification',
            html: this.wrapLayout(content, `Your ${previousRole} role has been updated.`),
            text: `Role Update: Your ${previousRole} role has been removed. You are now a regular user.`,
        });
    }

    async sendAccountSuspended(
        email: string,
        name: string,
        reason: string,
    ): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">⚠️</div>
                <h2 style="color: #dc2626; font-size: 20px; font-weight: 700; margin: 0;">Account Suspended</h2>
            `, '#fef2f2', '#fecaca')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${name ? ` ${name}` : ''}, your BarterWave account has been suspended.
            </p>

            ${this.highlightBox(`
                <p style="color: #991b1b; font-weight: 600; margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
            `, '#fef2f2', '#fecaca')}

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 16px 0 0;">
                If you believe this is a mistake, please contact our support team to appeal this decision.
            </p>
        `;

        return this.send({
            to: email,
            subject: '⚠️ BarterWave — Account status update',
            html: this.wrapLayout(content, 'Important update regarding your BarterWave account.'),
            text: `Your BarterWave account has been suspended. Reason: ${reason}. Contact support if you believe this is a mistake.`,
        });
    }

    // ========================================================================
    // PASSWORD CHANGED NOTIFICATION
    // ========================================================================

    async sendPasswordChanged(email: string, name: string): Promise<boolean> {
        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">🔒</div>
                <h2 style="color: #166534; font-size: 20px; font-weight: 700; margin: 0;">Password Changed</h2>
            `, '#f0fdf4', '#bbf7d0')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${name ? ` ${name}` : ''}, your BarterWave account password was just changed successfully.
            </p>

            ${this.callout("If you did not make this change, please reset your password immediately and contact our support team.", 'danger')}
        `;

        return this.send({
            to: email,
            subject: '🔒 BarterWave — Password changed',
            html: this.wrapLayout(content, 'Your password was changed.'),
            text: `Hi${name ? ` ${name}` : ''}, your BarterWave password was changed. If this wasn't you, reset your password immediately.`,
        });
    }

    // ========================================================================
    // AGGRESSIVE BOOST EMAIL TEMPLATE
    // ========================================================================

    async sendAggressiveBoostNotification(
        email: string,
        userName: string,
        listingTitle: string,
        categoryName: string,
        sellerName: string,
        listingId: string,
    ): Promise<boolean> {
        const listingLink = `${this.frontendUrl}/listings/${listingId}`;

        const content = `
            ${this.highlightBox(`
                <div style="font-size: 40px; margin-bottom: 8px;">🔥</div>
                <h2 style="color: #dc2626; font-size: 20px; font-weight: 700; margin: 0;">Hot Deal Alert!</h2>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Based on your interests</p>
            `, '#fff7ed', '#fed7aa')}

            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
                Hi${userName ? ` ${userName}` : ''}, a new listing just dropped that we think you'll love! <strong>${sellerName}</strong> is selling:
            </p>

            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 16px 0; border: 2px solid #f97316;">
              <h3 style="color: #111827; margin: 0 0 6px; font-size: 17px; font-weight: 700;">${listingTitle}</h3>
              <p style="color: #f97316; font-weight: 600; margin: 0; font-size: 14px;">📂 ${categoryName}</p>
            </div>

            ${this.ctaButton('View This Deal →', listingLink, 'linear-gradient(135deg, #f97316, #dc2626)')}

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0;">
                You received this because you've shown interest in ${categoryName} listings on BarterWave.
            </p>
        `;

        return this.send({
            to: email,
            subject: `🔥 Hot deal: "${listingTitle}" in ${categoryName}!`,
            html: this.wrapLayout(content, `Hot deal in ${categoryName}: ${listingTitle} by ${sellerName}`),
            text: `Hot Deal Alert! ${sellerName} is selling "${listingTitle}" in ${categoryName}. Check it out: ${listingLink}`,
        });
    }
}
