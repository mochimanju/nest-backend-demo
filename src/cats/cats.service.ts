import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

import { Cat } from './entities/cat.entity';
import { CreateCatInput } from './dto/create-cat.input';
import { UpdateCatInput } from './dto/update-cat.input';

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat.name) private readonly catModel: Model<Cat>,
    private readonly redis: RedisService,
    private readonly kafka: KafkaService,
  ) {}

  async findAll(): Promise<Cat[]> {
    const cache = await this.redis.get('cats');

    if (cache) {
      console.log('ใช้ Redis Cache');
      return cache;
    }

    const cats = await this.catModel.find();
    await this.redis.set('cats', cats);
    return cats;
  }

  async findOne(id: string): Promise<Cat | null> {
    return this.catModel.findById(id);
  }

  async create(input: CreateCatInput): Promise<Cat> {
    const newCat = await this.catModel.create(input);

    // Clear cache
    await this.redis.delete('cats');

    // ส่งข้อความไป Kafka topic: message.send
    await this.kafka.sendMessage({
      action: 'cat-created',
      data: newCat,
      timestamp: new Date(),
    });

    return newCat;
  }

  async update(input: UpdateCatInput): Promise<Cat | null> {
    const { id, ...updateData } = input;

    const updatedCat = await this.catModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    await this.redis.delete('cats');

    return updatedCat;
  }

  async remove(id: string): Promise<Cat | null> {
    const deletedCat = await this.catModel.findByIdAndDelete(id);

    await this.redis.delete('cats');

    return deletedCat;
  }
}
