import {
    ExecutionContext,
    Injectable,
    NestInterceptor,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((exception) => {
                // Capture specific details about the request
                const rpc = context.switchToRpc(); // If you use microservices
                const http = context.switchToHttp();
                const request = http.getRequest();

                // Don't report expected 4xx errors (unless critical)
                const status =
                    exception instanceof HttpException
                        ? exception.getStatus()
                        : HttpStatus.INTERNAL_SERVER_ERROR;

                if (status >= 500) {
                    Sentry.captureException(exception, {
                        extra: {
                            url: request?.url,
                            method: request?.method,
                            body: request?.body,
                            params: request?.params,
                            query: request?.query,
                        },
                    });
                }

                throw exception;
            }),
        );
    }
}
