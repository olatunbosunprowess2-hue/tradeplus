import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountriesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.country.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findRegions(countryId: number) {
        return this.prisma.region.findMany({
            where: { countryId },
            orderBy: { name: 'asc' },
        });
    }
}
