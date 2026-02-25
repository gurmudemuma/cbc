/**
 * Kafka Consumer Service
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../utils/logger';

type MessageHandler = (message: any) => Promise<void>;

export class KafkaConsumer {
  private static kafka: Kafka;
  private static consumer: Consumer;
  private static handlers: Map<string, MessageHandler> = new Map();
  private static isConnected = false;
  private static isRunning = false;

  static async connect(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: 'blockchain-bridge',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
      });

      this.consumer = this.kafka.consumer({
        groupId: 'blockchain-bridge-group'
      });

      await this.consumer.connect();
      this.isConnected = true;

      logger.info('Kafka Consumer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka Consumer:', error);
      throw error;
    }
  }

  static async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka Consumer not connected');
    }

    try {
      // Store the handler
      this.handlers.set(topic, handler);

      // Only subscribe if not already running
      if (!this.isRunning) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`Subscribed to topic: ${topic}`);
      } else {
        logger.warn(`Cannot subscribe to ${topic} while consumer is running. Restart required.`);
      }
    } catch (error) {
      logger.error(`Failed to subscribe to ${topic}:`, error);
      throw error;
    }
  }

  static async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Kafka Consumer already running');
      return;
    }

    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const handler = this.handlers.get(topic);
            if (!handler) {
              logger.warn(`No handler for topic: ${topic}`);
              return;
            }

            const value = message.value?.toString();
            if (!value) {
              logger.warn('Empty message received');
              return;
            }

            const data = JSON.parse(value);
            await handler(data);
          } catch (error) {
            logger.error(`Error processing message from ${topic}:`, error);
          }
        }
      });

      this.isRunning = true;
      logger.info('Kafka Consumer started');
    } catch (error) {
      logger.error('Failed to start Kafka Consumer:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.isConnected = false;
      this.isRunning = false;
      logger.info('Kafka Consumer disconnected');
    }
  }
}
