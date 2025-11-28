import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async set(key: string, value: any, expireSeconds?: number) {
    const data = JSON.stringify(value);

    if (expireSeconds) {
      // EX = expire เป็นวินาที
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
