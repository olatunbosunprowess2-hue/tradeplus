import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware
 * 
 * Logs all HTTP requests to help with debugging and monitoring.
 * 
 * What it logs:
 * - HTTP method (GET, POST, etc.)
 * - Request URL
 * - Response status code
 * - Response size
 * - User agent (browser/client info)
 * 
 * Example log: "GET /api/listings 200 1234 - Mozilla/5.0..."
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    // Create a logger instance with 'HTTP' context for easy filtering
    private logger = new Logger('HTTP');

    /**
     * Middleware function that runs for every HTTP request
     * 
     * @param request - Incoming HTTP request
     * @param response - Outgoing HTTP response
     * @param next - Function to call the next middleware
     */
    use(request: Request, response: Response, next: NextFunction): void {
        const { method, originalUrl } = request;
        const userAgent = request.get('user-agent') || '';

        // Listen for when the response is finished being sent
        response.on('finish', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length');

            // Log the request details
            // Format: "METHOD /path STATUS SIZE - USER_AGENT"
            this.logger.log(
                `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`
            );
        });

        // Continue to the next middleware/route handler
        next();
    }
}
