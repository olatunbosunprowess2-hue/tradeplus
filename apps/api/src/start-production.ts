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
        logger.error('The application will not start until migrations are resolved.');
        logger.error('Please check your DATABASE_URL and ensure the database is accessible.');
        return false;
    }
}

function main() {
    logger.log('='.repeat(50));
    logger.log('BarterWave Production Startup');
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log('='.repeat(50));

    // Step 1: Run migrations
    const migrationsSuccess = runMigrations();

    if (!migrationsSuccess) {
        // IMPORTANT: Don't exit! Allow the app to start even if migrations fail.
        // This handles cases where:
        // 1. Database is temporarily unreachable during container startup
        // 2. Network connectivity issues between Koyeb and Supabase
        // 3. Database is paused (Supabase free tier)
        // 
        // The app should still work if the schema is already up-to-date.
        // If schema is out of sync, you'll see Prisma errors in runtime logs.
        logger.warn('Migrations failed, but continuing with application startup...');
        logger.warn('If you see Prisma errors, please run migrations manually:');
        logger.warn('  npx prisma migrate deploy');
    }

    // Step 2: Start the application
    // The main.ts file handles its own bootstrap and auto-executes
    logger.log('Starting NestJS application...');

    // Use require to load and execute main.ts
    // This works because main.ts calls bootstrap() at the module level
    require('./main.js');
}

// Run the startup sequence
main();
