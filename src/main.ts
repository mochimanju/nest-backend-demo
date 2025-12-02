import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // สร้างตัวแอป NestJS โดยใช้ AppModule
  const app = await NestFactory.create(AppModule);
  // บังคับใช้ validation ทั้งระบบ
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true, 
  }));
  await app.listen(3000);
}
// เริ่มต้นแอป
bootstrap();
