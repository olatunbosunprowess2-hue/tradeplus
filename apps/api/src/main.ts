import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, urlencoded } from 'express';

/**
 * Bootstrap Function
 * 
 * This is the entry point of the application.
 * It creates the NestJS application and configures all middleware, pipes, and documentation.
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // VALIDATION PIPE
  // Automatically validates all incoming requests against DTOs (Data Transfer Objects)
  // This prevents invalid data from reaching your controllers
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Strip properties that don't have decorators
      transform: true,               // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true,    // Throw error if non-whitelisted properties are present
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
    .setTitle('TradePlus API')
    .setDescription('The TradePlus marketplace API documentation')
    .setVersion('1.0')
    .addBearerAuth()  // Adds authentication support in Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS (Cross-Origin Resource Sharing)
  // Allows the frontend (running on a different port) to communicate with the API
  // In production, this should be restricted to your actual frontend domain
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',  // Allow requests from frontend
    credentials: true,  // Allow cookies to be sent with requests
  });

  // Start the server on port 3333
  await app.listen(3333);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}

// Start the application
bootstrap();
