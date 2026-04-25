import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { Post, Lead } from './models/schemas.js';
import { contentQueue } from './jobs/processors/index.js';
import { instagramService } from './services/instagram.service.js';

const fastify = Fastify({
  logger: false, // We use our custom logger
});

export async function buildApp() {
  // Plugins
  await fastify.register(cors);
  await fastify.register(staticFiles, {
    root: path.join(process.cwd(), 'temp/images'),
    prefix: '/exports/',
  });
  await fastify.register(jwt, { secret: config.JWT_SECRET });
  
  await fastify.register(swagger, {
    swagger: {
      info: { title: 'Mira Veloura API', version: '1.0.0' },
      securityDefinitions: {
        apiKey: { type: 'apiKey', name: 'Authorization', in: 'header' }
      }
    }
  });
  
  await fastify.register(swaggerUi, { routePrefix: '/docs' });

  // Auth Route
  fastify.post('/auth/login', async (request: any, reply) => {
    const { username, password } = request.body;
    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
      const token = fastify.jwt.sign({ username });
      return { token };
    }
    return reply.code(401).send({ error: 'Unauthorized' });
  });

  // Generation Routes
  fastify.post('/generate/today', async (request, reply) => {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    // @ts-ignore
    const theme = request.body?.theme || 'luxury lifestyle';
    const job = await contentQueue.add('manual-gen', { type: 'image', theme });
    return { jobId: job.id, message: 'Generation started' };
  });

  // History & Analytics
  fastify.get('/content/history', async () => {
    return Post.find().sort({ createdAt: -1 }).limit(20);
  });

  fastify.get('/analytics', async () => {
    const totalPosts = await Post.countDocuments({ status: 'posted' });
    const leads = await Lead.countDocuments();
    return { totalPosts, leads, followers: '12.4k (mock)' };
  });

  // Lead Generation
  fastify.post('/vip/lead', async (request: any) => {
    const { email, message } = request.body;
    const lead = await Lead.create({ email, message, type: 'vip' });
    return { success: true, leadId: lead._id };
  });

  fastify.get('/instagram/discover', async (request, reply) => {
    try {
      const accounts = await instagramService.getBusinessAccountId();
      return { accounts };
    } catch (error: any) {
      return reply.code(500).send({ error: error.response?.data || error.message });
    }
  });

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

  return fastify;
}
