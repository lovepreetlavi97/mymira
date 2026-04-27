import { replicateService } from '../services/replicate.service.js';
import { getReplicatePrompt } from '../services/character.service.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to generate consistent images using Replicate
 * usage: tsx src/scripts/generate-consistent-replicate.ts "your theme here"
 */
async function run() {
  const theme = process.argv[2] || 'Relaxing on a luxury yacht, sun-kissed skin, wearing a sheer white cover-up';
  
  logger.info({ theme }, '🔥 Starting Consistent Image Generation via Replicate');
  
  try {
    const prompt = getReplicatePrompt(theme);
    logger.info({ prompt }, 'Generated Prompt');
    
    const imagePath = await replicateService.generateImage(prompt);
    
    logger.info(`✨ Successfully generated! Saved to: ${imagePath}`);
  } catch (error: any) {
    logger.error(`❌ Generation failed: ${error.message}`);
  }
}

run();
