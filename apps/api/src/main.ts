import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';

/**
 * Bootstrap Function
 * 
 * This is the entry point of the application.
 * It creates the NestJS application and configures all middleware, pipes, and documentation.
 */

// Fix for BigInt serialization (Prisma returns BigInt, JSON.stringify fails)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // COMPRESSION MIDDLEWARE
  // Compresses response bodies for all requests (reduces bandwidth by 70-90%)
  app.use(compression());

  // Increase body size limit for image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // HELMET SECURITY HEADERS
  // Comprehensive security headers protection
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for Swagger UI
    crossOriginEmbedderPolicy: false, // Allow embedding for certain use cases
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // VALIDATION PIPE
  // Automatically validates all incoming requests against DTOs (Data Transfer Objects)
  // This prevents invalid data from reaching your controllers
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Strip properties that don't have decorators
      transform: true,               // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: false,    // Allow non-whitelisted properties (like file uploads) to pass through
    }),
  );

  // GLOBAL EXCEPTION FILTER
  // Catches all errors and formats them into consistent JSON responses
  // Makes debugging easier and provides better error messages to clients
  app.useGlobalFilters(new AllExceptionsFilter());

  // SWAGGER/OPENAPI DOCUMENTATION
  // Auto-generates interactive API documentation
  // Visit http://localhost:3333/api/docs to see all available endpoints
  const config = new DocumentBuilder()
    .setTitle('BarterWave API')
    .setDescription('The BarterWave API description')
    .setVersion('1.0')
    .addBearerAuth()  // Adds authentication support in Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS (Cross-Origin Resource Sharing)
  // Allows the frontend (running on a different port) to communicate with the API
  // In production, this is restricted to your actual frontend domain
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://barterwave.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3002'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,  // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Start the server
  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}

// Start the application
bootstrap();
