import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS'u etkinleştir
  app.enableCors({
    origin: 'http://localhost:3000', // React uygulamanızın çalıştığı URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(8080);
}
bootstrap();
