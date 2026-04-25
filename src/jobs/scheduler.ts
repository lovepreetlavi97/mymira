import cron from 'node-cron';
import { contentQueue } from './processors';
import { getRandomTheme } from '../services/character.service';
import { logger } from '../utils/logger';

export function setupScheduler() {
  // Daily 8 AM: Feed Post Generation
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running 8 AM Feed Post Schedule');
    const theme = getRandomTheme();
    
    if (contentQueue) {
      await contentQueue.add('daily-feed', { type: 'image', theme });
    } else {
      logger.warn('Content Queue not initialized, skipping schedule');
    }
  });

  // Daily 1 PM: Story Generation
  cron.schedule('0 13 * * *', async () => {
    logger.info('Running 1 PM Story Schedule');
    const theme = getRandomTheme() + ', looking at camera, lifestyle vibe';
    
    if (contentQueue) {
      await contentQueue.add('daily-story', { type: 'story', theme });
    }
  });

  // Daily 8 PM: Another Feed/Reel Post
  cron.schedule('0 20 * * *', async () => {
    logger.info('Running 8 PM Night Post Schedule');
    const theme = getRandomTheme() + ', premium night vibe';
    
    if (contentQueue) {
      await contentQueue.add('daily-night', { type: 'image', theme });
    }
  });

  // Weekly Reels: Mon, Wed, Sat at 6 PM
  cron.schedule('0 18 * * *', async () => {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon
    if ([1, 3, 6].includes(day)) {
      logger.info('Running Weekly Reel Schedule');
      if (contentQueue) {
        await contentQueue.add('weekly-reel', { type: 'reel', theme: getRandomTheme() });
      }
    }
  });
}
