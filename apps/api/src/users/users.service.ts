import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const profile = await this.prisma.userProfile.update({
            where: { userId },
            data: {
                ...dto,
            },
            include: {
                country: true,
                region: true,
            },
        });

        return profile;
    }
}
