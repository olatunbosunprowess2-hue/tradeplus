import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Records a device fingerprint for a user.
     * This should be called on Login and Ad Creation.
     */
    async trackDevice(userId: string, fingerprint: { hash: string, ip: string, userAgent: string, country?: string }) {
        try {
            await this.prisma.deviceFingerprint.create({
                data: {
                    userId,
                    hash: fingerprint.hash,
                    ipAddress: fingerprint.ip,
                    userAgent: fingerprint.userAgent,
                    country: fingerprint.country
                }
            });

            // Also update User's IP fields
            await this.prisma.user.update({
                where: { id: userId },
                data: { lastLoginIp: fingerprint.ip }
            });
        } catch (e) {
            this.logger.error(`Failed to track device for user ${userId}`, e);
        }
    }

    /**
     * CRON JOB: Runs every 15 minutes to detect and flag suspicious activity.
     */
    @Cron('*/15 * * * *')
    async runSecurityChecks() {
        this.logger.log('Running Security Detection Jobs...');
        await this.detectAccountFlooding();
        await this.detectAdFlooding();
        await this.detectDeviceSharing();
    }

    // Rule 1: Same IP creates > 4 accounts in 24h
    private async detectAccountFlooding() {
        // Query users created in last 24h, group by signupIpAddress
        // Prisma doesn't support concise 'HAVING count > 4' in groupBy easily for strings? use raw.
        const floodedIps = await this.prisma.$queryRaw`
            SELECT signup_ip_address as ip, COUNT(id) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '24 hours'
              AND signup_ip_address IS NOT NULL
            GROUP BY signup_ip_address
            HAVING COUNT(id) > 4
        `;

        for (const record of floodedIps as any[]) {
            await this.flagIp(record.ip, `Account Flooding: ${record.count} accounts created in 24h`);
        }
    }

    // Rule 2: Same IP posts > 15 ads in 1h
    private async detectAdFlooding() {
        // Need to join Seller to get IP? User.lastLoginIp might be stale.
        // Better to use DeviceFingerprint or AuditLogs.
        // Let's assume we use AuditLog for AD_CREATED or DeviceFingerprint recent entries.
        // Actually, let's look at Listings + User IP. 
        // We really should be storing IP on Listing, but we didn't add that.
        // We will use DeviceFingerprint entries in last hour as a proxy for activity? No.
        // Let's use User.lastLoginIp for the sellers of recent ads. Imperfect but workable for now.
        // OR better: use DeviceFingerprint created_at count? No, that's logins.

        // Let's use AuditLogs for "CREATE_LISTING" if we were logging them properly.
        // Assuming we start logging IP on Listing creation in the future.
        // For now, let's skip strict ad-flooding check or use AuditLogs if available.
        // Let's implement using AuditLogs for 'CREATE_LISTING' (Assuming we have implemented that logging).

        const floodedIps = await this.prisma.$queryRaw`
            SELECT ip_address as ip, COUNT(id) as count
            FROM audit_logs
            WHERE action = 'CREATE_LISTING'
              AND created_at > NOW() - INTERVAL '1 hour'
            GROUP BY ip_address
            HAVING COUNT(id) > 15
        `;

        for (const record of floodedIps as any[]) {
            await this.flagIp(record.ip, `Ad Flooding: ${record.count} ads posted in 1h`);
            // Also TODO: Find users associated with this IP and auto-suspend?
            // this.autoSuspendUsersByIp(record.ip);
        }
    }

    // Rule 3: Same Fingerprint > 3 accounts
    private async detectDeviceSharing() {
        const botNets = await this.prisma.$queryRaw`
            SELECT hash, COUNT(DISTINCT user_id) as count
            FROM device_fingerprints
            GROUP BY hash
            HAVING COUNT(DISTINCT user_id) > 3
        `;

        for (const record of botNets as any[]) {
            this.logger.warn(`Bot Net Detected! Fingerprint ${record.hash} used by ${record.count} users.`);
            // In a real app, we would mark these users as 'SUSPICIOUS' in DB.
            // For now, log and email admin.
            await this.alertAdmin(`Bot Net Detected: Hash ${record.hash} used by ${record.count} accounts.`);
        }
    }

    private async flagIp(ip: string, reason: string) {
        // Check if already blocked or flagged
        const existing = await this.prisma.blockedIp.findUnique({ where: { ipAddress: ip } });
        if (!existing) {
            this.logger.warn(`FLAGGING SUSPICIOUS IP: ${ip} - ${reason}`);
            // Auto-block or just warn? Requirement said "Auto-alert". "Block button" is manual.
            // But "IP-blocking middleware" implies we use BlockedIp table.
            // Let's validly insert into BlockedIp but maybe with a "WARNING" reason, 
            // or just use the Admin Table to show it.
            // The requirement says "Admin must have a Suspicious IPs table".
            // It doesn't strictly say "Auto-add to blocked table". 
            // But to make the table work, we might need a model for "SuspiciousIp" or just query logs.
            // Let's just Log/Email for now, and maybe create a BlockedIp entry if critical.
            await this.alertAdmin(`Suspicious IP Alert: ${ip} - ${reason}`);
        }
    }

    private async alertAdmin(msg: string) {
        // Placeholder for Email Service
        this.logger.error(`[ADMIN ALERT] ${msg}`);
    }

    // Admin API Methods
    async getSuspiciousIps() {
        // Aggregate interesting stats for the UI table
        // This combines data from BlockedIps, AuditLogs, etc.
        // For the "Suspicious IPs" table: IP | Country | Total Accounts | Ads | Last Seen

        // 1. Get IPs with high account creation
        const highActivityIps = await this.prisma.$queryRaw`
            SELECT 
                signup_ip_address as ip, 
                COUNT(id) as total_accounts, 
                MAX(created_at) as last_seen
            FROM users
            WHERE signup_ip_address IS NOT NULL
            GROUP BY signup_ip_address
            HAVING COUNT(id) > 1 -- Show even small dupes for demo? Or >1.
            ORDER BY total_accounts DESC
            LIMIT 50
        `;

        return highActivityIps;
    }

    async blockIp(ip: string, reason: string = 'Manual Block') {
        return this.prisma.blockedIp.create({
            data: {
                ipAddress: ip,
                reason,
                expiresAt: null // Permanent
            }
        });
    }

    async isIpBlocked(ip: string): Promise<boolean> {
        const blocked = await this.prisma.blockedIp.findUnique({ where: { ipAddress: ip } });
        return !!blocked;
    }
}
