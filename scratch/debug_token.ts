import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
const BASE_URL = 'https://graph.facebook.com/v19.0';

async function debugToken() {
  try {
    console.log('Debugging Token...');
    const debugResponse = await axios.get(`${BASE_URL}/debug_token`, {
      params: {
        input_token: ACCESS_TOKEN,
        access_token: `${process.env.INSTAGRAM_CLIENT_ID}|${process.env.INSTAGRAM_CLIENT_SECRET}`
      }
    });

    console.log('Token Info:', JSON.stringify(debugResponse.data.data, null, 2));

    console.log('\nChecking /me...');
    const meResponse = await axios.get(`${BASE_URL}/me`, {
      params: { access_token: ACCESS_TOKEN }
    });
    console.log('Me:', meResponse.data);

    console.log('\nChecking /me/accounts...');
    const accountsResponse = await axios.get(`${BASE_URL}/me/accounts`, {
      params: { access_token: ACCESS_TOKEN }
    });
    console.log('Accounts:', JSON.stringify(accountsResponse.data, null, 2));

  } catch (error: any) {
    console.error('Error debugging token:', error.response?.data || error.message);
  }
}

debugToken();
