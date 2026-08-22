import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const uploadDir = join(process.cwd(), 'uploads', 'informes');
  const signaturesDir = join(process.cwd(), 'uploads', 'firmas');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  if (!existsSync(signaturesDir)) {
    mkdirSync(signaturesDir, { recursive: true });
  }

  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('SENA Reports API')
    .setDescription('API for managing instructor monthly reports, contracts, obligations, and signatures')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);
  server.timeout = 240000; // 4 minutos de timeout para procesos de IA
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
