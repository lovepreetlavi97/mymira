
import { instagramService } from '../services/instagram.service';
import { logger } from './logger';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function makeFirstPost() {
  // Replace with your actual public image URL
  const imageUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000"; 
  const caption = "Elegance is the only beauty that never fades. ✨ #MiraVeloura #AIInfluencer #Luxury";

  logger.info('🚀 Starting first post attempt...');
  
  try {
    const postId = await instagramService.postImage(imageUrl, caption);
    logger.info(`✅ Successfully posted! Post ID: ${postId}`);
  } catch (error: any) {
    logger.error(`❌ Failed to post: ${error.message}`);
    if (error.response?.data) {
      console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

makeFirstPost();
