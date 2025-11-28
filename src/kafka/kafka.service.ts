import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'nestjs-app',
      brokers: ['localhost:29092'], 
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('Kafka Producer connected');
  }

  async sendMessage(value: object) {
    const topic = 'message.send';

    const payload = JSON.parse(JSON.stringify(value));

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });

    console.log(`[Kafka] Sent to ${topic}:`, payload);
  }
}
