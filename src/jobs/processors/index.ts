import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../config/env';
import { aiProvider } from '../../services/ai-provider.service';
import { mediaService } from '../../services/media.service';
import { instagramService } from '../../services/instagram.service';
import { s3Service } from '../../services/s3.service';
import { getMasterPrompt } from '../../services/character.service';
import { Post } from '../../models/schemas';
import { logger } from '../../utils/logger';
import { MIRA_IDENTITY } from '../../services/character.service';
import Redis from 'ioredis';

const redisUrl = config.REDIS_URL;

// Simple check to see if Redis is actually there
async function checkRedis() {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null // Don't retry
  });

  return new Promise((resolve) => {
    redis.on('error', () => {
      redis.disconnect();
      resolve(false);
    });
    redis.on('connect', () => {
      redis.disconnect();
      resolve(true);
    });
    // Timeout after 1s
    setTimeout(() => {
      redis.disconnect();
      resolve(false);
    }, 1000);
  });
}

export let contentQueue: any = null;
export let postingQueue: any = null;

export async function initializeWorkers() {
  const isRedisAvailable = await checkRedis();

  if (!isRedisAvailable) {
    logger.warn('⚠️  Redis not found at ' + redisUrl + '. Background automation is DISABLED. (Server will still run)');
    return;
  }

  const connection = { url: redisUrl, maxRetriesPerRequest: null };

  contentQueue = new Queue('content-generation', { connection });
  postingQueue = new Queue('ig-posting', { connection });

  new Worker('content-generation', async (job: Job) => {
    const { type, theme } = job.data;
    logger.info({ type, theme }, 'Generating content...');
    try {
      const prompt = getMasterPrompt(theme, config.ENABLE_LORA);
      const imagePath = await aiProvider.generateImage(prompt, MIRA_IDENTITY.negativePrompts.join(', '));
      const upscalePath = await mediaService.upscaleTo8k(imagePath);
      const igPath = await mediaService.optimizeForInstagram(imagePath, type === 'story' ? 'story' : 'feed');
      const caption = await aiProvider.generateCaption(prompt);
      const post = await Post.create({ type, theme, caption, localPath: igPath, archived8kPath: upscalePath, status: 'generated' });
      await postingQueue.add('post-to-ig', { postId: post._id });
      return { postId: post._id, caption };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Generation job failed');
      throw error;
    }
  }, { connection });

  new Worker('ig-posting', async (job: Job) => {
    const { postId } = job.data;
    const post = await Post.findById(postId);
    if (!post || !post.localPath) throw new Error('Post not found');
    
    try {
      logger.info({ postId }, 'Posting to Instagram...');
      
      // 1. Upload to S3 for public URL access
      let publicUrl = '';
      if (config.AWS_ACCESS_KEY_ID && config.AWS_S3_BUCKET) {
        logger.info({ postId }, 'Uploading to S3 for Instagram pull...');
        publicUrl = await s3Service.uploadFile(post.localPath);
      } else {
        // Fallback to local URL if S3 is not configured
        publicUrl = `${process.env.PUBLIC_URL || 'http://YOUR_NGROK_URL'}/exports/${path.basename(post.localPath)}`;
      }
      
      if (!config.INSTAGRAM_ACCESS_TOKEN || !config.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
         logger.warn('Instagram credentials missing, skipping real post');
         return;
      }

      const igId = await instagramService.postImage(publicUrl, post.caption || '');
      
      post.igMediaId = igId;
      post.status = 'posted';
      await post.save();
      
      // await mediaService.cleanup(post.localPath); // Keep for now for debugging
      logger.info({ postId, igId }, '✅ Post successful on Instagram');
    } catch (error: any) {
      post.status = 'failed';
      await post.save();
      logger.error({ error: error.message, postId }, '❌ Instagram posting failed');
      throw error;
    }
  }, { connection });

  logger.info('✅ Redis found. Background workers started.');
}
