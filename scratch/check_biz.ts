
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const baseUrl = 'https://graph.facebook.com/v19.0';
async function checkBiz() {
  try {
    const res = await axios.get(`${baseUrl}/me/businesses`, { params: { access_token: token } });
    console.log('Businesses:', JSON.stringify(res.data, null, 2));
    const res2 = await axios.get(`${baseUrl}/me/adaccounts`, { params: { access_token: token } });
    console.log('Ad Accounts:', JSON.stringify(res2.data, null, 2));
  } catch (e) {
    console.log('Check failed');
  }
}
checkBiz();
