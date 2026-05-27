import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ProcessCrashGuard');
  const isProd = process.env.NODE_ENV === 'production';

  process.on('uncaughtException', (error) => {
    logger.error(
      `Uncaught Exception captured: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
    if (isProd) process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(
      `Unhandled Rejection captured: ${
        reason instanceof Error ? reason.message : JSON.stringify(reason)
      }`,
      reason instanceof Error ? reason.stack : undefined,
    );
    if (isProd) process.exit(1);
  });

  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors(
    corsOrigins.length > 0
      ? { origin: corsOrigins, credentials: true }
      : { origin: '*', credentials: false },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Viva Femini API')
    .setDescription('The Viva Femini API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
