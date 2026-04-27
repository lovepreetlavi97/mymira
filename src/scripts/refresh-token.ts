import { instagramService } from '../services/instagram.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to exchange a short-lived token for a 60-day long-lived token
 * and update the .env file automatically.
 * 
 * Usage: npx tsx src/scripts/refresh-token.ts <YOUR_SHORT_LIVED_TOKEN>
 */
async function refresh() {
  const tokenToRefresh = process.argv[2] || config.INSTAGRAM_ACCESS_TOKEN;

  if (!tokenToRefresh) {
    logger.error('No token provided. Provide a short-lived token as an argument.');
    process.exit(1);
  }

  logger.info('🔄 Initiating 60-Day Token Exchange...');

  try {
    const longLivedToken = await instagramService.getLongLivedToken(tokenToRefresh);
    logger.info('✅ Received Long-Lived Token (Valid for 60 days)');

    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf8');

    const regex = /^INSTAGRAM_ACCESS_TOKEN=.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `INSTAGRAM_ACCESS_TOKEN=${longLivedToken}`);
    } else {
      envContent += `\nINSTAGRAM_ACCESS_TOKEN=${longLivedToken}`;
    }

    await fs.writeFile(envPath, envContent);
    logger.info('📝 .env file updated with the new 60-day token.');

  } catch (error: any) {
    logger.error(`❌ Token exchange failed: ${error.message}`);
    if (error.response?.data) {
      logger.error(error.response.data, 'Meta API Details');
    }
  }
}

refresh();
