import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
  origin: 'http://localhost:3000', // Allow only your Next.js frontend
  methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  credentials: true, // Include cookies, authorization headers
});

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
