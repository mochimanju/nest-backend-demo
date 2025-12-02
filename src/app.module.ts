import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { CatsModule } from './cats/cats.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    // โหลด config จาก .env ทำให้ ใช้ ConfigService ดึงค่าได้
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้ใช้ได้ทุก module
    }),

    // เชื่อมต่อกับ MongoDB ผ่าน Mongoose
    MongooseModule.forRootAsync({
      // เพื่อให้ใช้ ConfigService ได้ใน useFactory
      imports: [ConfigModule],
      // ให้ NestJS inject ConfigService เข้ามาใน useFactory
      inject: [ConfigService],
      // ฟังก์ชันใช้ดึงค่าจาก .env เพื่อตั้งค่า MongoDB
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DATABASE'),
        user: configService.get<string>('MONGODB_USER'),
        pass: configService.get<string>('MONGODB_PASS'),
      }),
    }),

    // ตั้งค่า GraphQL โดยใช้ Apollo Driver
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // อ่านไฟล์ schema GraphQL (.graphql) ทุกไฟล์ในโปรเจค (Schema First)
      typePaths: ['./**/*.graphql'],
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    
    RedisModule,
    KafkaModule,
    CatsModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
