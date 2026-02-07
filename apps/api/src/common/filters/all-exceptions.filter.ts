import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * AllExceptionsFilter
 * 
 * Global exception filter that catches ALL errors in the application.
 * Provides consistent error response format for better client-side error handling.
 * 
 * Why we need this:
 * - Without this, different errors would have different response formats
 * - Makes it easier for frontend to display error messages
 * - Helps with debugging by including request details
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    /**
     * Catches and processes any exception thrown in the application
     * 
     * @param exception - The error that was thrown
     * @param host - Provides access to request/response objects
     */
    catch(exception: unknown, host: ArgumentsHost) {
        // Get the HTTP context (request/response objects)
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        // Determine the HTTP status code
        // If it's a known HttpException, use its status code
        // Otherwise, default to 500 (Internal Server Error)
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Extract the error message
        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Create a standardized error response
        const errorResponse = {
            statusCode: status,                    // HTTP status code (e.g., 400, 404, 500)
            timestamp: new Date().toISOString(),   // When the error occurred
            path: request.url,                     // Which endpoint was called
            method: request.method,                // HTTP method (GET, POST, etc.)
            message: typeof message === 'string' ? message : (message as any).message || message,
        };

        // Log critical errors for monitoring
        // In production, errors are logged to stdout/stderr which is captured by the container runtime
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'INTERNAL_SERVER_ERROR',
                method: request.method,
                url: request.url,
                user: (request as any).user?.id || 'anonymous',
                body: request.body,
                error: exception instanceof Error ? {
                    name: exception.name,
                    message: exception.message,
                    stack: exception.stack,
                } : String(exception),
            };
            console.error('Internal Server Error:', JSON.stringify(logEntry, null, 2));
        }

        // Send the formatted error response to the client
        response.status(status).json(errorResponse);
    }
}
