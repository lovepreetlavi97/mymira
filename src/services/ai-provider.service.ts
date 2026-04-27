import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { replicateService } from './replicate.service.js';

export class AiProviderService {
  /**
   * Triple-Layer Production Generation Logic
   */
  async generateImage(prompt: string, negativePrompt: string, width = 1024, height = 1024, useReplicate = false): Promise<string> {
    logger.info({ prompt: prompt.substring(0, 100) + '...' }, '🚀 Initiating Image Generation');

    // If Replicate is explicitly requested or if it's the only one with a token
    if (useReplicate || (config.REPLICATE_API_TOKEN && !config.FLUX_API_KEY)) {
      try {
        return await replicateService.generateImage(prompt, width, height);
      } catch (error) {
        logger.warn('Replicate failed, trying fallbacks...');
      }
    }

    if (!config.FLUX_API_KEY) throw new Error('FLUX_API_KEY or REPLICATE_API_TOKEN is required.');

    // Strategy: Try Flux-Pro -> Fallback to Flux-Dev -> Final Fallback to Clean Kontext
    const models = ['flux-pro', 'flux-dev', 'flux-kontext-pro'];

    for (const model of models) {
      try {
        logger.info(`Attempting generation with model: ${model}`);
        return await this._executeFluxTask(model, prompt, width, height);
      } catch (error: any) {
        logger.warn(`Model ${model} failed or blocked. Moving to next fallback...`);
      }
    }

    throw new Error('All Flux models failed. Please check prompt safety or API credits.');
  }

  private async _executeFluxTask(model: string, prompt: string, width: number, height: number): Promise<string> {
    const payload = {
      prompt,
      enableTranslation: true,
      aspectRatio: "16:9",
      outputFormat: "jpeg",
      model: model,
      promptUpsampling: false, // Set to false to avoid AI adding risky words
      safetyTolerance: 6       // Most permissive for professional model photography
    };

    const endpoint = `https://api.fluxapi.ai/api/v1/flux/${model.includes('kontext') ? 'kontext' : 'pro'}/generate`;
    const statusEndpoint = `https://api.fluxapi.ai/api/v1/flux/${model.includes('kontext') ? 'kontext' : 'pro'}/record-info`;

    const submitResponse = await axios.post(endpoint, payload, {
      headers: { 
        'Authorization': `Bearer ${config.FLUX_API_KEY?.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    if (submitResponse.data.code !== 200) {
      throw new Error(`Submission Error: ${submitResponse.data.msg}`);
    }

    const taskId = submitResponse.data.data.taskId;
    const startTime = Date.now();

    while (Date.now() - startTime < 120000) { // 2m Timeout
      const statusResponse = await axios.get(`${statusEndpoint}?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${config.FLUX_API_KEY?.trim()}` }
      });

      const { data } = statusResponse.data;
      if (data.successFlag === 1) { // SUCCESS
        return await this._download(data.resultImageUrl);
      } else if (data.successFlag === 2 || data.successFlag === 3) { // FAILURE
        throw new Error(`Task ${taskId} failed on server side.`);
      }

      await new Promise(r => setTimeout(r, 5000));
    }

    throw new Error('Polling Timeout');
  }

  private async _download(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileName = `mira_safe_${Date.now()}.jpg`;
    const filePath = path.join(process.cwd(), 'temp/images', fileName);
    await fs.writeFile(filePath, Buffer.from(response.data));
    return filePath;
  }

  async generateCaption(prompt: string): Promise<string> {
    if (config.GROQ_API_KEY) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: 'Luxury lifestyle copywriter. Short captions. Max 10 words.' },
            { role: 'user', content: prompt }
          ]
        }, { headers: { Authorization: `Bearer ${config.GROQ_API_KEY}` } });
        return response.data.choices[0].message.content.replace(/"/g, '');
      } catch (e) { return "Elegance defined."; }
    }
    return "Rare energy.";
  }
}

export const aiProvider = new AiProviderService();
