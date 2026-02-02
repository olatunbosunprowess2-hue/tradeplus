import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWantDto } from './dto/create-want.dto';
import { UpdateWantDto } from './dto/update-want.dto';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class WantsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }


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

    /**
     * Checks all pending "Wants" against a newly created listing.
     * Notifies users whose "Wants" match the listing's parameters.
     */
    async checkMatchesForListing(listingId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: {
                category: true,
                country: true,
                region: true,
            },
        });

        if (!listing || listing.status !== 'active') return;

        // Find matching wants
        // Logic: Category must match (by name or ID if we used IDs).
        // Plus fuzzy match on title if possible, or just exact for now.
        // Location must match (Country/State).
        const matches = await this.prisma.want.findMany({
            where: {
                isFulfilled: false,
                category: listing.category.name, // Matching by category name
                country: listing.country?.name || '',
                // state: listing.region?.name || '', // State might be tricky, some might leave empty
                // We'll filter state/region in JS for better control if needed, 
                // but let's try to match it if provided.
            },
        });

        for (const want of matches) {
            // Further filtering: Check title similarity or exact match
            const containsKeywords = want.title.toLowerCase().split(' ').some(word =>
                listing.title.toLowerCase().includes(word)
            );

            if (containsKeywords) {
                // Determine location for notification message
                const locationStr = [listing.region?.name, listing.country?.name].filter(Boolean).join(', ');

                await this.notificationsService.create(want.userId, 'WANT_MATCH', {
                    title: 'Item Found!',
                    message: `A new listing "${listing.title}" matches your search in ${locationStr}.`,
                    listingId: listing.id,
                    wantId: want.id,
                });
            }
        }
    }
}

