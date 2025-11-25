import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWantDto } from './dto/create-want.dto';
import { UpdateWantDto } from './dto/update-want.dto';

@Injectable()
export class WantsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createWantDto: CreateWantDto) {
        return this.prisma.want.create({
            data: {
                ...createWantDto,
                userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.want.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllByUser(userId: string) {
        return this.prisma.want.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        const want = await this.prisma.want.findFirst({
            where: { id, userId },
        });

        if (!want) {
            throw new NotFoundException(`Want with ID ${id} not found`);
        }

        return want;
    }

    async update(id: string, userId: string, updateWantDto: UpdateWantDto) {
        // Check if exists and belongs to user
        await this.findOne(id, userId);

        return this.prisma.want.update({
            where: { id },
            data: updateWantDto,
        });
    }

    async remove(id: string, userId: string) {
        // Check if exists and belongs to user
        await this.findOne(id, userId);

        return this.prisma.want.delete({
            where: { id },
        });
    }
}
