import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BASE_URL = 'https://graph.facebook.com/v19.0';

async function findIds() {
  try {
    console.log('Fetching Pages...');
    const pagesResponse = await axios.get(`${BASE_URL}/me/accounts`, {
      params: {
        fields: 'instagram_business_account,name',
        access_token: ACCESS_TOKEN
      }
    });

    const pages = pagesResponse.data.data;
    if (!pages || pages.length === 0) {
      console.log('No Facebook Pages found for this token.');
      return;
    }

    console.log('Found Pages:');
    pages.forEach((page: any) => {
      console.log(`- Page Name: ${page.name}`);
      console.log(`  Page ID: ${page.id}`);
      console.log(`  Instagram Business Account ID: ${page.instagram_business_account?.id || 'NOT LINKED'}`);
    });

  } catch (error: any) {
    console.error('Error fetching IDs:', error.response?.data || error.message);
  }
}

findIds();
