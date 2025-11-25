import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * 
 * This service extends PrismaClient and provides database access throughout the application.
 * It implements soft delete functionality to prevent accidental data loss.
 * 
 * Soft Delete: Instead of permanently removing records, we mark them as deleted with a timestamp.
 * This allows data recovery and maintains audit trails.
 */
@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {

    /**
     * Called when the module is initialized
     * Sets up database connection and soft delete middleware
     */
    async onModuleInit() {
        // Establish connection to the database
        await this.$connect();

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
        await this.$disconnect();
    }
}
