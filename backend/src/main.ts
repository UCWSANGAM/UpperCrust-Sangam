import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // Security headers
  app.use(helmet());

  // Strict input validation on every endpoint — reject unknown fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Never leak stack traces / internal errors to clients
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // Graceful shutdown — required on Railway (SIGTERM on redeploy/scale-down)
  app.enableShutdownHooks();
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`SANGAM backend listening on ${port}`);
}
bootstrap().catch((err) => {
  console.error('FATAL: backend failed to start');
  console.error(err);
  process.exit(1);
});
