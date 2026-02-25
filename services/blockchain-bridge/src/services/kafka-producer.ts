/**
 * Kafka Producer Service
 */

import { Kafka, Producer, Admin } from 'kafkajs';
import { logger } from '../utils/logger';

export class KafkaProducer {
  private static kafka: Kafka;
  private static producer: Producer;
  private static admin: Admin;
  private static isConnected = false;
  private static createdTopics = new Set<string>();

  static async connect(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: 'blockchain-bridge',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
      });

      this.producer = this.kafka.producer();
      this.admin = this.kafka.admin();
      
      await this.producer.connect();
      await this.admin.connect();
      this.isConnected = true;

      logger.info('Kafka Producer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka Producer:', error);
      throw error;
    }
  }

  private static async ensureTopicExists(topic: string): Promise<void> {
    if (this.createdTopics.has(topic)) {
      return; // Already created in this session
    }

    try {
      const topics = await this.admin.listTopics();
      
      if (!topics.includes(topic)) {
        logger.info(`Creating Kafka topic: ${topic}`);
        await this.admin.createTopics({
          topics: [{
            topic,
            numPartitions: 1,
            replicationFactor: 1
          }],
          waitForLeaders: true,
          timeout: 10000
        });
        logger.info(`Created Kafka topic: ${topic}`);
      }
      
      this.createdTopics.add(topic);
    } catch (error: any) {
      // Topic might already exist, that's okay
      if (error.type === 'TOPIC_ALREADY_EXISTS') {
        this.createdTopics.add(topic);
      } else {
        logger.warn(`Could not ensure topic ${topic} exists:`, error.message);
      }
    }
  }

  static async publish(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka Producer not connected');
    }

    try {
      // Ensure topic exists before publishing
      await this.ensureTopicExists(topic);

      await this.producer.send({
        topic,
        messages: [{
          key: message.id || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString()
        }]
      });

      logger.debug(`Published to ${topic}:`, message);
    } catch (error) {
      logger.error(`Failed to publish to ${topic}:`, error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.admin) {
      await this.admin.disconnect();
    }
    if (this.producer) {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka Producer disconnected');
    }
  }
}
