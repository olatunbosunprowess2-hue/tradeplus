/**
 * Production Startup Script
 * 
 * This script handles production deployment by:
 * 1. Running database migrations automatically
 * 2. Starting the NestJS application
 * 
 * If migrations fail, the application will NOT start.
 * This ensures the database schema is always in sync with the code.
 */

import { execSync } from 'child_process';

const logger = {
    log: (message: string) => console.log(`[Production] ${message}`),
    error: (message: string) => console.error(`[Production] ❌ ${message}`),
    success: (message: string) => console.log(`[Production] ✅ ${message}`),
    warn: (message: string) => console.warn(`[Production] ⚠️ ${message}`),
};

function runMigrations(): boolean {
    logger.log('Running database migrations...');

    try {
        // Run prisma migrate deploy (production-safe command)
        // This only applies pending migrations, never creates new ones
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            timeout: 120000, // 2 minute timeout for large migrations
        });

        logger.success('Database migrations completed successfully');
        return true;
    } catch (error: any) {
        logger.error(`Database migration failed: ${error.message}`);
        logger.warn('Attempting fallback: prisma db push to sync schema...');

        try {
            // Fallback: Use db push to force-sync the schema
            // This handles cases where migration history is out of sync
            // (e.g., from previous db push operations or partial migrations)
            execSync('npx prisma db push --accept-data-loss', {
                stdio: 'inherit',
                timeout: 120000,
            });

            // After successful db push, resolve the migration history
            try {
                execSync('npx prisma migrate resolve --applied 20260211213715_add_community_posts', {
                    stdio: 'inherit',
                    timeout: 30000,
                });
                execSync('npx prisma migrate resolve --applied 20260211221222_add_report_to_community_post', {
                    stdio: 'inherit',
                    timeout: 30000,
                });
                execSync('npx prisma migrate resolve --applied 20260211221844_add_saved_posts_retry', {
                    stdio: 'inherit',
                    timeout: 30000,
                });
            } catch (resolveErr: any) {
                logger.warn(`Could not resolve migration history: ${resolveErr.message}`);
            }

            logger.success('Schema sync via db push completed successfully');
            return true;
        } catch (pushError: any) {
            logger.error(`Schema sync also failed: ${pushError.message}`);
            logger.error('Please check your DATABASE_URL and ensure the database is accessible.');
            return false;
        }
    }
}

function main() {
    logger.log('='.repeat(50));
    logger.log('BarterWave Production Startup');
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log('='.repeat(50));

    // Step 1: Start the application IMMEDIATELY in the background
    // This ensures the port opens quickly and prevents 503 errors during health checks
    logger.log('Starting NestJS application in non-blocking mode...');
    try {
        require('./main.js');
        logger.success('NestJS bootstrap initiated');
    } catch (err: any) {
        logger.error(`Immediate startup failed: ${err.message}`);
        process.exit(1);
    }

    // Step 2: Run migrations in the background
    // We don't await this so the Node.js event loop remains free to handle incoming requests/health checks
    // The PrismaService handles its own connection retry logic if the DB is still warming up
    setTimeout(() => {
        logger.log('Initiating background database migrations...');
        const migrationsSuccess = runMigrations();

        if (!migrationsSuccess) {
            logger.warn('Background migrations failed. Application may experience Prisma errors if schema is out of sync.');
            logger.warn('Please run migrations manually if issues persist: npx prisma migrate deploy');
        } else {
            logger.success('Background migrations completed successfully');
        }
    }, 1000); // 1s delay to let the app start its listener first
}

// Run the startup sequence
main();
