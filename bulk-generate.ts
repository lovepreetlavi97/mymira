import axios from 'axios';
import { logger } from './src/utils/logger';

async function bulkGenerate() {
  const themes = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  logger.info('🚀 Starting Bulk Generation for 14 Days...');

  // Loop twice to get 14 days
  for (let i = 0; i < 14; i++) {
    const dayIndex = i % 7;
    const dayName = themes[dayIndex];
    const dayNum = i + 1;

    logger.info(`📸 Generating Day ${dayNum} (${dayName})...`);
    
    try {
      // We call the local API to trigger the job
      await axios.post('http://127.0.0.1:3000/generate/today', {
        theme: `Batch 14-Day - Day ${dayNum}: ${dayName}`
      });
      
      logger.info(`✅ Day ${dayNum} started successfully.`);
      
      // Wait a bit between requests to let the queue handle it
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      logger.error(`❌ Failed to start Day ${dayNum}: ${error.message}`);
    }
  }

  logger.info('✨ All 14 generation jobs have been queued!');
}

bulkGenerate();
