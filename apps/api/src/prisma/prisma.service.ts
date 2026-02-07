import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * 
 * This service extends PrismaClient and provides database access throughout the application.
 * It implements:
 * - Soft delete functionality to prevent accidental data loss
 * - Connection retry with exponential backoff for production resilience
 * - Detailed logging for database connection status
 */
@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger('PrismaService');
    private readonly MAX_RETRIES = 5;
    private readonly INITIAL_DELAY_MS = 2000;

    // Track connection status for potential lazy reconnection
    private isConnected = false;

    /**
     * Connect to database with retry logic
     * Uses exponential backoff: 2s, 4s, 8s, 16s, 32s
     * 
     * IMPORTANT: This method is NON-BLOCKING to allow container startup
     * even when the database is temporarily unreachable.
     */
    private async connectWithRetry(attempt = 1): Promise<void> {
        try {
            this.logger.log(`Attempting database connection (attempt ${attempt}/${this.MAX_RETRIES})...`);
            await this.$connect();
            this.isConnected = true;
            this.logger.log('✅ Database connection established successfully');
        } catch (error) {
            const isLastAttempt = attempt >= this.MAX_RETRIES;
            const delay = this.INITIAL_DELAY_MS * Math.pow(2, attempt - 1);

            this.logger.error(
                `❌ Database connection failed (attempt ${attempt}/${this.MAX_RETRIES}): ${error.message}`
            );

            if (isLastAttempt) {
                // CRITICAL: Do NOT throw here! Allow the app to start.
                // The database might become available later, and queries will
                // trigger connection errors on demand instead of crashing startup.
                this.logger.error(
                    '🚨 All database connection attempts exhausted. App will start in DEGRADED MODE.'
                );
                this.logger.error(
                    '⚠️ Database operations will fail until the database becomes available.'
                );
                this.logger.error(
                    'Please check: DATABASE_URL, database status, network connectivity.'
                );
                // Do NOT throw - let the app start
                return;
            }

            this.logger.warn(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.connectWithRetry(attempt + 1);
        }
    }

    /**
     * Called when the module is initialized
     * Sets up database connection with retry and soft delete middleware
     */
    async onModuleInit() {
        // Establish connection with retry logic
        await this.connectWithRetry();

        // Soft Delete Middleware
        // This intercepts database queries and modifies them to handle soft deletes
        this.$use(async (params, next) => {
            // List of models that support soft deletes
            const models = ['User', 'Listing', 'Order'];

            // Only apply soft delete logic to supported models
            if (params.model && models.includes(params.model)) {

                // HANDLE FIND OPERATIONS
                // When finding records, automatically exclude soft-deleted ones
                if (params.action === 'findUnique' || params.action === 'findFirst') {
                    // findUnique doesn't support filtering, so convert to findFirst
                    params.action = 'findFirst';
                    // Add filter to exclude deleted records (where deletedAt is null)
                    params.args.where['deletedAt'] = null;
                }

                if (params.action === 'findMany') {
                    // For findMany, add deletedAt filter if not already specified
                    if (params.args.where) {
                        // Only add filter if deletedAt wasn't explicitly set
                        if (params.args.where.deletedAt == undefined) {
                            params.args.where['deletedAt'] = null;
                        }
                    } else {
                        // No where clause exists, create one with deletedAt filter
                        params.args.where = { deletedAt: null };
                    }
                }
            }

            // HANDLE DELETE OPERATIONS
            // Convert hard deletes to soft deletes by updating deletedAt timestamp
            if (params.model && models.includes(params.model)) {
                if (params.action == 'delete') {
                    // Convert delete to update operation
                    params.action = 'update';
                    // Set deletedAt to current timestamp instead of removing record
                    params.args['data'] = { deletedAt: new Date() };
                }

                if (params.action == 'deleteMany') {
                    // Convert deleteMany to updateMany
                    params.action = 'updateMany';
                    if (params.args.data != undefined) {
                        params.args.data['deletedAt'] = new Date();
                    } else {
                        params.args.data = { deletedAt: new Date() };
                    }
                }
            }

            // Continue with the modified query
            return next(params);
        });
    }

    /**
     * Called when the module is destroyed
     * Cleanly closes database connection
     */
    async onModuleDestroy() {
        this.logger.log('Closing database connection...');
        await this.$disconnect();
        this.logger.log('Database connection closed');
    }
}
