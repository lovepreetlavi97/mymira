
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateDalleImage() {
    if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not found in .env');
        return;
    }

    const prompt = "A hyper-realistic 8k photo of a luxury AI influencer named Mira, sitting in a high-end cafe in Paris. Alluring gaze, human realism, soft morning light, shot on iPhone 15 Pro aesthetic.";
    
    console.log('🚀 Generating image with DALL-E 3...');

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "hd",
                response_format: "url"
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const imageUrl = response.data.data[0].url;
        console.log('✅ Image generated successfully. Downloading...');

        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        
        const dir = path.join(process.cwd(), 'temp/images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `mira_dalle_${Date.now()}.png`;
        const filePath = path.join(dir, fileName);

        fs.writeFileSync(filePath, imageResponse.data);
        console.log(`✨ Image saved to: ${filePath}`);

    } catch (error: any) {
        console.error('❌ DALL-E Generation Failed:', error.response?.data || error.message);
    }
}

generateDalleImage();
