import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export class MediaService {
  async upscaleTo8k(inputPath: string): Promise<string> {
    const fileName = `8k_${path.basename(inputPath)}`;
    const outputPath = path.join(process.cwd(), 'archive/8k', fileName);

    logger.info({ inputPath, outputPath }, 'Upscaling image to 8K...');

    try {
      await sharp(inputPath)
        .resize(7680, null, { fit: 'inside', kernel: 'lanczos3' })
        .sharpen()
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      logger.info({ outputPath }, '✅ 8K Upscale successful');
    } catch (error: any) {
      logger.error({ error: error.message, inputPath, outputPath }, '❌ 8K Upscale failed');
      throw error;
    }

    return outputPath;
  }

  async optimizeForInstagram(inputPath: string, type: 'feed' | 'story'): Promise<string> {
    const fileName = `${type}_${path.basename(inputPath)}`;
    const outputPath = path.join(process.cwd(), 'temp/images', fileName);

    const dimensions = type === 'feed' ? { width: 1080, height: 1350 } : { width: 1080, height: 1920 };

    await sharp(inputPath)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    return outputPath;
  }

  async createReel(imagePath: string, text: string): Promise<string> {
    const fileName = `reel_${Date.now()}.mp4`;
    const outputPath = path.join(process.cwd(), 'temp/reels', fileName);

    logger.info({ imagePath, outputPath }, 'Creating 7s reel from image...');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop(7)
        .videoFilters([
          'scale=1080:1920:force_original_aspect_ratio=increase',
          'crop=1080:1920',
          'zoompan=z=\'min(zoom+0.0015,1.5)\':d=175:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1080x1920'
        ])
        .outputOptions([
          '-c:v libx264',
          '-t 7',
          '-pix_fmt yuv420p',
          '-r 30'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          logger.error({ err: err.message }, 'FFmpeg reel generation failed');
          reject(err);
        })
        .run();
    });
  }

  async cleanup(filePath: string): Promise<void> {
    try {
      if (await fs.stat(filePath).catch(() => null)) {
        await fs.unlink(filePath);
        logger.info({ filePath }, 'Cleaned up temporary file');
      }
    } catch (error: any) {
      logger.error({ filePath, error: error.message }, 'Cleanup failed');
    }
  }
}

export const mediaService = new MediaService();
