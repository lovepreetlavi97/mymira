import mongoose from 'mongoose';
import { buildApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { setupScheduler } from './jobs/scheduler';
import { initializeWorkers } from './jobs/processors';

async function start() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    logger.info('Connected to MongoDB');

    // 2. Build Fastify App
    const app = await buildApp();

    // 3. Setup Jobs & Cron
    try {
      await initializeWorkers();
      setupScheduler();
      logger.info('Scheduler and Job Workers initialized');
    } catch (schedErr: any) {
      logger.error({ err: schedErr.message }, 'Background initialization failed');
    }

    // 4. Listen
    const address = await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`Mira Veloura Backend running at ${address}`);
    logger.info(`Swagger docs available at ${address}/docs`);

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
