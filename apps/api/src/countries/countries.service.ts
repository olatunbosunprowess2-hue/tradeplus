import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Country as CSC, State } from 'country-state-city';

@Injectable()
export class CountriesService implements OnModuleInit {
    private readonly logger = new Logger(CountriesService.name);

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Ensure countries are populated on startup if count is suspiciously low
        // We expect ~240 countries. If less than 200, sync them.
        const count = await this.prisma.country.count();
        this.logger.log(`🌍 Current country count in DB: ${count}`);

        if (count < 200) {
            this.logger.log('🌍 Populating/Updating country list from library...');
            await this.syncCountries();
        }
    }

    private async syncCountries() {
        try {
            const countries = CSC.getAllCountries();
            this.logger.log(`📚 Found ${countries.length} countries in library`);

            const data = countries.map(c => ({
                name: c.name,
                code: c.isoCode,
            }));

            // Use transaction for bulk insert
            const result = await this.prisma.country.createMany({
                data,
                skipDuplicates: true,
            });
            this.logger.log(`✅ Synced ${result.count} new countries to database`);
        } catch (error) {
            this.logger.error('❌ Failed to sync countries:', error);
        }
    }

    async findAll() {
        const countries = await this.prisma.country.findMany({
            orderBy: { name: 'asc' },
        });

        if (countries.length < 200) {
            await this.syncCountries();
            return this.prisma.country.findMany({
                orderBy: { name: 'asc' },
            });
        }

        return countries;
    }

    async findRegions(countryId: number) {
        // Check if regions already exist in DB for this country
        const regions = await this.prisma.region.findMany({
            where: { countryId },
            orderBy: { name: 'asc' },
        });

        // Some countries might not have states in the library (e.g. Singapore)
        // So we keep track if we've already tried to fetch regions for this country
        // For now, if we have ANY regions, we assume it's seeded.
        if (regions.length > 0) {
            return regions;
        }

        // If no regions, fetch from library and cache in DB
        const country = await this.prisma.country.findUnique({
            where: { id: countryId },
        });

        if (!country) return [];

        this.logger.log(`📍 Fetching regions for ${country.name} (${country.code})...`);
        const cscStates = State.getStatesOfCountry(country.code);
        this.logger.log(`📚 Library found ${cscStates.length} states for ${country.code}`);

        if (cscStates.length > 0) {
            const data = cscStates.map(s => ({
                name: s.name,
                countryId: country.id,
            }));

            await this.prisma.region.createMany({
                data,
                skipDuplicates: true,
            });

            return this.prisma.region.findMany({
                where: { countryId },
                orderBy: { name: 'asc' },
            });
        }

        return [];
    }
}
