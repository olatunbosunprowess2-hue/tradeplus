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
        try {
            // Get the HTTP context (request/response objects)
            const ctx = host.switchToHttp();
            const response = ctx.getResponse<Response>();
            const request = ctx.getRequest();

            // Determine if it's an HttpException (duck typing for robustness)
            const isHttpException =
                exception instanceof HttpException ||
                (typeof exception === 'object' && exception !== null && 'getStatus' in exception && 'getResponse' in exception);

            // Determine the HTTP status code
            const status = isHttpException
                ? (exception as any).getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

            // Extract the error message
            const rawMessage = isHttpException
                ? (exception as any).getResponse()
                : 'Internal server error';

            // Log non-HTTP exceptions for debugging
            if (!isHttpException) {
                console.error('Non-HTTP exception caught in global filter:', exception);
            }

            // Standardize the message
            let message = 'Internal server error';
            if (typeof rawMessage === 'string') {
                message = rawMessage;
            } else if (typeof rawMessage === 'object' && rawMessage !== null) {
                message = (rawMessage as any).message || JSON.stringify(rawMessage);
            }

            // Create a standardized error response
            const errorResponse = {
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                message: message,
            };

            // Log critical errors for monitoring
            if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
                try {
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
                } catch (logErr) {
                    console.error('Critical error in AllExceptionsFilter logging:', logErr);
                    console.error('Original exception:', exception);
                }
            }

            // Send the formatted error response to the client
            response.status(status).json(errorResponse);
        } catch (filterError) {
            // Last resort: the filter itself crashed
            console.error('FATAL: AllExceptionsFilter CRASHED:', filterError);
            const ctx = host.switchToHttp();
            const response = ctx.getResponse<Response>();
            response.status(500).json({
                statusCode: 500,
                message: 'Internal server error (filter failed)',
                timestamp: new Date().toISOString()
            });
        }
    }
}
