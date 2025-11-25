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
        // In production, you would send these to a logging service like Sentry or DataDog
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error('Internal Server Error:', exception);

            // Write to error log file
            try {
                const fs = require('fs');
                const path = require('path');
                // Use absolute path to ensure we find the file
                const logPath = 'C:/Users/PC/Desktop/TradePlus/TradePlus/backend_error.log';
                const logEntry = `\n[${new Date().toISOString()}] ${request.method} ${request.url}\nUser: ${JSON.stringify((request as any).user)}\nBody: ${JSON.stringify(request.body)}\nException: ${JSON.stringify(exception, Object.getOwnPropertyNames(exception))}\nStack: ${(exception as any).stack}\n`;
                fs.appendFileSync(logPath, logEntry);
            } catch (e) {
                console.error('Failed to write to error log:', e);
            }
        }

        // Send the formatted error response to the client
        response.status(status).json(errorResponse);
    }
}
