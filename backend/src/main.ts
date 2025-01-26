import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config(); // .env dosyasını yükle

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS'u etkinleştir
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.1.110:3000'], // React uygulamanızın çalıştığı URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
