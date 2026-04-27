import { replicateService } from '../services/replicate.service.js';
import { getReplicatePrompt, MIRA_IDENTITY } from '../services/character.service.js';
import { mediaService } from '../services/media.service.js';
import { instagramService } from '../services/instagram.service.js';
import { s3Service } from '../services/s3.service.js';
import { aiProvider } from '../services/ai-provider.service.js';
import { Post } from '../models/schemas.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function oneOffUpload() {
  const theme = process.argv[2] || 'wearing a one-piece blue dress, sophisticated allure, nude aesthetic';
  
  logger.info({ theme }, '🚀 Starting One-Off Generation and Instagram Upload');

  try {
    // 1. Connect to DB (needed to save the post)
    if (config.MONGO_URI) {
      await mongoose.connect(config.MONGO_URI);
      logger.info('Connected to MongoDB');
    }

    // 2. Generate Prompt & Image
    const prompt = getReplicatePrompt(theme);
    logger.info({ prompt }, 'Generated Prompt');
    
    // We explicitly use Replicate for this
    const imagePath = await replicateService.generateImage(prompt);
    logger.info({ imagePath }, 'Image Generated');

    // 3. Upscale and Optimize
    logger.info('Upscaling and Optimizing for Instagram...');
    const upscalePath = await mediaService.upscaleTo8k(imagePath);
    const igPath = await mediaService.optimizeForInstagram(imagePath, 'feed');
    
    // 4. Generate Caption
    const caption = await aiProvider.generateCaption(prompt);
    logger.info({ caption }, 'Caption Generated');

    // 5. Upload to S3 for Instagram access
    logger.info('Uploading to S3...');
    const publicUrl = await s3Service.uploadFile(igPath);
    logger.info({ publicUrl }, 'S3 Public URL');

    // 6. Post to Instagram
    if (!config.INSTAGRAM_ACCESS_TOKEN || !config.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      throw new Error('Instagram credentials missing in .env');
    }

    logger.info('Posting to Instagram...');
    const igId = await instagramService.postImage(publicUrl, caption);
    logger.info({ igId }, '✅ Successfully posted to Instagram!');

    // 7. Save to Database
    const post = await Post.create({
      type: 'feed',
      theme,
      caption,
      localPath: igPath,
      archived8kPath: upscalePath,
      igMediaId: igId,
      status: 'posted'
    });
    
    logger.info({ postId: post._id }, 'Post record saved to database');

  } catch (error: any) {
    logger.error(`❌ One-off upload failed: ${error.message}`);
    if (error.response?.data) {
      logger.error(error.response.data, 'API Error Details');
    }
  } finally {
    await mongoose.disconnect();
  }
}

oneOffUpload();
