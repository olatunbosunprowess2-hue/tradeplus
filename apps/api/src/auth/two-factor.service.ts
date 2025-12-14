import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
    constructor(private prisma: PrismaService) { }

    async generateSecret(userId: string) {
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(userId, 'BarterWave', secret);

        // Save secret to user (encrypted in real app, plain for now/demo)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        return {
            secret,
            otpauthUrl
        };
    }

    async generateQrCode(otpauthUrl: string) {
        return toDataURL(otpauthUrl);
    }

    async verifyCode(token: string, secret: string) {
        return authenticator.verify({ token, secret });
    }
}
