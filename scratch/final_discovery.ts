
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const baseUrl = 'https://graph.facebook.com/v19.0';

async function discoverId() {
  if (!token) {
    console.error('No token found in .env');
    return;
  }

  try {
    console.log('Fetching accounts...');
    const response = await axios.get(`${baseUrl}/me/accounts`, {
      params: {
        fields: 'instagram_business_account,name',
        access_token: token
      }
    });

    const pages = response.data.data;
    if (!pages || pages.length === 0) {
      console.error('No pages found. Ensure you have linked your IG to a FB page.');
      return;
    }

    for (const page of pages) {
      if (page.instagram_business_account) {
        const igId = page.instagram_business_account.id;
        console.log(`✅ Found Instagram Business Account ID: ${igId} (on page: ${page.name})`);
        
        // Update .env
        const envPath = path.resolve('.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/INSTAGRAM_BUSINESS_ACCOUNT_ID=.*/, `INSTAGRAM_BUSINESS_ACCOUNT_ID=${igId}`);
        fs.writeFileSync(envPath, envContent);
        console.log('Updated .env file successfully!');
        return;
      }
    }

    console.error('No Instagram Business Account linked to your pages.');
  } catch (error) {
    console.error('Discovery failed:', error.response?.data || error.message);
  }
}

discoverId();
