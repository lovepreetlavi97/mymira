import Replicate from 'replicate';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export class ReplicateService {
  private replicate: Replicate | null = null;

  constructor() {
    if (config.REPLICATE_API_TOKEN) {
      this.replicate = new Replicate({
        auth: config.REPLICATE_API_TOKEN,
      });
    }
  }

  async generateImage(prompt: string, width = 1024, height = 1024, seed?: number): Promise<string> {
    if (!this.replicate) {
      throw new Error('REPLICATE_API_TOKEN is not configured.');
    }

    logger.info({ prompt: prompt.substring(0, 100) + '...', seed }, '🚀 Initiating Replicate Generation');

    try {
      const input: any = {
        prompt: prompt,
        width: width,
        height: height,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 5, // Use 5 (max allowed for flux-2-pro)
        prompt_upsampling: false
      };

      if (seed) {
        input.seed = seed;
      } else {
        // Use a consistent seed for character identity if not provided
        // This helps maintain face structure across generations with same prompt base
        input.seed = 42; 
      }

      // Using FLUX.2 [pro] as requested
      const model = "black-forest-labs/flux-2-pro";
      const output: any = await this.replicate.run(model, { input });
      
      // output is usually an array of URLs or a single URL stream
      const imageUrl = Array.isArray(output) ? output[0] : (output.url ? output.url() : output);
      
      logger.info('✅ Image generated successfully by Replicate');
      return await this._download(imageUrl);
    } catch (error: any) {
      logger.error(`❌ Replicate generation failed: ${error.message}`);
      throw error;
    }
  }

  private async _download(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileName = `mira_replicate_${Date.now()}.webp`;
    const filePath = path.join(process.cwd(), 'temp/images', fileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    await fs.writeFile(filePath, Buffer.from(response.data));
    return filePath;
  }
}

export const replicateService = new ReplicateService();
