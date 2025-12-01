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

    /**
     * สร้าง Kafka instance
     * - clientId: ชื่อ client ที่ใช้เชื่อมต่อกับ Kafka broker
     * - brokers: รายการที่อยู่ของ Kafka broker(s)
     */
    const kafka = new Kafka({
      clientId,
      brokers,
    });

    // สร้าง Producer instance
    this.producer = kafka.producer();
  }

  // เรียกตอน module เริ่มทำงาน
  // ทำหน้าที่ connect producer กับ Kafka broker
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
    // สร้าง topic สำหรับส่ง event เป็นที่เก็บ event
    const topic = 'cats.events'; 

    // สร้างรูปแบบ message ที่จะส่งไป Kafka 
    const message = {
      event: eventName,
      data: payload,
      // เวลาที่ส่ง event (ISO format)
      timestamp: new Date().toISOString(),
    };

    // ส่ง message ไปยัง Kafka
    await this.producer.send({
      topic,
      // message ต้องเป็น string → ส่ง JSON.stringify
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log(`[Kafka] Emit: ${topic}:`, message);
  }
}
