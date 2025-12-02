import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  // อ่านค่าการตั้งค่า Redis จาก .env
  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');

    // สร้างการเชื่อมต่อ (connection) ไปยัง Redis Server 
    this.client = new Redis({
      host,
      port,
    });
  }

  async set(key: string, value: object, expireSeconds?: number) {
    const data = JSON.stringify(value);

    if (expireSeconds) {
      return this.client.set(key, data, 'EX', expireSeconds);
    }

    return this.client.set(key, data);
  }

  async get(key: string) {
    const result = await this.client.get(key);
    return result ? JSON.parse(result) : null;
  }

  async delete(key: string) {
    return this.client.del(key);
  }
}
