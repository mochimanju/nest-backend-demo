import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.producer.service';
import { Cat } from './database/cat.schema';
import { CreateCatInput } from './dto/create-cat.input';
import { UpdateCatInput } from './dto/update-cat.input';

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat.name) private readonly catModel: Model<Cat>, // Inject Model ของ Mongoose
    private readonly redis: RedisService, // Service สำหรับจัดการ Redis Cache
    private readonly kafka: KafkaService, // Service สำหรับส่ง Event ไป Kafka
  ) {}

  /**
   * ลบ cache รายการแมวทั้งหมด
   * ใช้เมื่อมีการ CREATE / UPDATE / DELETE
   */
  private async clearCache() {
    await this.redis.delete('cats'); // เคลียร์ cache key: 'cats'
  }

  /**
   * อ่านแมวทั้งหมด
   * - ถ้ามี cache → คืนค่าจาก Redis
   * - ถ้าไม่มี cache → ดึงจาก MongoDB และเก็บ cache ใหม่
   * - ส่ง Kafka logs ทุกครั้ง
   */
  async findAll(): Promise<Cat[]> {
    const cacheKey = 'cats';

    // 1) ลองดึงข้อมูลจาก cache ก่อน
    const cache = await this.redis.get(cacheKey);
    if (cache) {
      // ส่ง event log ว่าดึงข้อมูลมาจาก cache
      await this.kafka.emit('getAllCats-from-cache', { source: 'findAll' });

      return cache; // คืนค่าทันทีจาก Redis
    }

    // 2) ไม่มี cache → ดึงจากฐานข้อมูล
    const cats = await this.catModel.find();

    // เก็บค่าใน Redis 60 วินาที
    await this.redis.set(cacheKey, cats, 60);

    // ส่ง event log ว่าดึงจาก DB จริง
    await this.kafka.emit('getAllCats', cats);

    return cats;
  }

  /**
   * อ่านข้อมูลแมว 1 ตัวจาก id
   * - ถ้ามี cache → ส่งคืนจาก Redis
   * - ถ้าไม่มี → ดึงจาก DB และเก็บลง Redis
   */
  async findOne(id: string): Promise<Cat> {
    const cacheKey = `cat:${id}`;

    // 1) ดึงจาก Redis ก่อน
    const cachedCat = await this.redis.get(cacheKey);

    if (cachedCat) {
      // log event ว่าดึงจาก cache
      await this.kafka.emit('getCatById-from-cache', { id });
      return cachedCat;
    }

    // 2) ไม่มี cache → ดึงจาก MongoDB
    const cat = await this.catModel.findOne({ _id: id });
    if (!cat) {
      throw new NotFoundException(`ไม่พบแมวที่มี id: ${id}`);
    }

    // เก็บลง Redis 60 วิ
    await this.redis.set(cacheKey, cat, 60);

    // ส่ง event log
    await this.kafka.emit('getCatById', cat);

    return cat;
  }

  /**
   * สร้างแมวใหม่
   * - บันทึกลง MongoDB
   * - ล้าง cache list
   * - ส่ง event ไป Kafka
   */
  async create(input: CreateCatInput): Promise<Cat> {
    const newCat = await this.catModel.create(input); // create document ใหม่

    await this.clearCache(); // clear list cache
    await this.kafka.emit('cat-created', newCat); // ส่ง event

    return newCat;
  }

  /**
   * อัปเดตข้อมูลแมวตาม id
   * - ตรวจสอบว่ามีตัวนั้นอยู่จริง
   * - อัปเดตข้อมูล
   * - ลบ cache รายตัว + ลบ cache list
   * - ส่ง event ไป Kafka
   */
  async update(input: UpdateCatInput): Promise<Cat> {
    const { id, ...updateData } = input;

    // ตรวจสอบว่ามีแมวนี้จริงหรือไม่
    const existing = await this.catModel.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException(`ไม่พบแมวที่มี id: ${id}`);
    }

    // อัปเดตข้อมูลและคืนค่าใหม่กลับมา
    const updatedCat = await this.catModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }, // new:true → ให้คืนค่าตัวใหม่หลังอัปเดต
    );

    if (!updatedCat) {
      throw new NotFoundException(`เกิดข้อผิดพลาดระหว่างอัปเดตแมว id: ${id}`);
    }

    await this.clearCache(); // เคลียร์ cache list
    await this.redis.delete(`cat:${id}`); // เคลียร์ cache รายตัว
    await this.kafka.emit('cat-updated', updatedCat); // ส่ง event

    return updatedCat;
  }

  /**
   * ลบข้อมูลแมวตาม id
   * - ตรวจสอบว่ามีแมวนี้จริง
   * - ลบออกจาก DB
   * - ลบ cache รายตัว + cache list
   * - ส่ง event ไป Kafka
   */
  async remove(id: string): Promise<Cat> {
    // ตรวจสอบว่ามีแมวนี้หรือไม่
    const existing = await this.catModel.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException(`ไม่พบแมวที่มี id: ${id}`);
    }

    // ลบออกจากฐานข้อมูล
    const deletedCat = await this.catModel.findOneAndDelete({ _id: id });

    if (!deletedCat) {
      throw new NotFoundException(`เกิดข้อผิดพลาดระหว่างลบแมว id: ${id}`);
    }

    await this.clearCache(); // ลบ cache list
    await this.redis.delete(`cat:${id}`); // ลบ cache รายตัว
    await this.kafka.emit('cat-deleted', deletedCat); // ส่ง event

    return deletedCat;
  }
}
