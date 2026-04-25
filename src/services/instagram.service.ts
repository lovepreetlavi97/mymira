import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class InstagramService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async postImage(imageUrl: string, caption: string): Promise<string> {
    logger.info('Posting image to Instagram...');
    
    if (!config.INSTAGRAM_ACCESS_TOKEN || !config.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      throw new Error('Instagram credentials missing');
    }

    try {
      // 1. Create Media Container
      const containerResponse = await axios.post(`${this.baseUrl}/${config.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
        image_url: imageUrl,
        caption: caption,
        access_token: config.INSTAGRAM_ACCESS_TOKEN
      });

      const creationId = containerResponse.data.id;

      // 2. Publish Media
      const publishResponse = await axios.post(`${this.baseUrl}/${config.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`, {
        creation_id: creationId,
        access_token: config.INSTAGRAM_ACCESS_TOKEN
      });

      return publishResponse.data.id;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Instagram post failed');
      throw error;
    }
  }

  async postReel(videoUrl: string, caption: string): Promise<string> {
    logger.info('Posting reel to Instagram...');
    
    try {
      // Containers for reels require media_type=REELS
      const containerResponse = await axios.post(`${this.baseUrl}/${config.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        access_token: config.INSTAGRAM_ACCESS_TOKEN
      });

      const creationId = containerResponse.data.id;

      // Reels need some time to process before publishing
      logger.info({ creationId }, 'Reel container created, waiting for processing...');
      
      // Real implementation should poll container status
      // For now, we assume calling publish will fail if not ready, so we'd need a background job
      
      return creationId;
    } catch (error: any) {
       logger.error({ error: error.response?.data || error.message }, 'Instagram reel failed');
       throw error;
    }
  }

  async checkStatus(containerId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/${containerId}`, {
      params: {
        fields: 'status_code',
        access_token: config.INSTAGRAM_ACCESS_TOKEN
      }
    });
    return response.data.status_code;
  }

  async getBusinessAccountId(): Promise<{ pageName: string, id: string, name: string }[]> {
    logger.info('Fetching Instagram Business Account ID...');
    const response = await axios.get(`${this.baseUrl}/me/accounts`, {
      params: {
        fields: 'instagram_business_account,name,access_token',
        access_token: config.INSTAGRAM_ACCESS_TOKEN
      }
    });

    return response.data.data
      .filter((page: any) => page.instagram_business_account)
      .map((page: any) => ({
        name: page.name,
        pageName: page.name,
        id: page.instagram_business_account.id,
        pageAccessToken: page.access_token
      }));
  }

  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    logger.info('Exchanging short-lived token for long-lived token...');
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.INSTAGRAM_CLIENT_ID,
          client_secret: config.INSTAGRAM_CLIENT_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });
      return response.data.access_token;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Token exchange failed');
      throw error;
    }
  }
}

export const instagramService = new InstagramService();
