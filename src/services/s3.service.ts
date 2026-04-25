import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

export class S3Service {
  private client: S3Client | null = null;

  constructor() {
    if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.AWS_REGION) {
      this.client = new S3Client({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async uploadFile(filePath: string, folder: string = 'posts'): Promise<string> {
    if (!this.client) {
      throw new Error('S3 Client not initialized. Check AWS credentials in .env');
    }

    const fileContent = await fs.readFile(filePath);
    const fileName = `${Date.now()}_${path.basename(filePath)}`;
    const key = `${folder}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: config.AWS_S3_BUCKET,
        Key: key,
        Body: fileContent,
        ContentType: this.getContentType(filePath),
      });

      await this.client.send(command);
      
      // Use path-style URL which is more compatible with some APIs
      const publicUrl = `https://s3.${config.AWS_REGION}.amazonaws.com/${config.AWS_S3_BUCKET}/${key}`;
      logger.info({ publicUrl }, '✅ File uploaded to S3');
      
      return publicUrl;
    } catch (error: any) {
      logger.error({ error: error.message, key }, '❌ S3 Upload failed');
      throw error;
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }
}

export const s3Service = new S3Service();
