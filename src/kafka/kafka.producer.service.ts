import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class KafkaService implements OnModuleInit {
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    // ดึง brokers จาก config (.env)
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') ?? [
      'localhost:29092',
    ];

    // generate clientId อัตโนมัติ (กันซ้ำ)
    const clientId = `nestjs-${randomUUID()}`;

    // สร้าง Kafka instance
    const kafka = new Kafka({
      clientId,
      brokers,
    });

    this.producer = kafka.producer();
  }

  // เรียกตอน module เริ่มทำงาน
  async onModuleInit() {
    await this.producer.connect();
    console.log('[Kafka] Producer connected');
  }

  /**
   * ส่ง Event แบบมาตรฐาน Kafka
   * topic: cats.events
   * value: object (จะถูก stringify ให้เอง)
   */
  async emit(eventName: string, payload: any) {
    const topic = 'cats.events'; // topic ของโปรเจกต์แมว

    const message = {
      event: eventName,
      data: payload,
      timestamp: new Date().toISOString(),
    };

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log(`[Kafka] Emit: ${topic}:`, message);
  }
}
