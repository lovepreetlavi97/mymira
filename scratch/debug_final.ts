
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const baseUrl = 'https://graph.facebook.com/v19.0';
async function debug() {
  try {
    const me = await axios.get(`${baseUrl}/me`, { params: { access_token: token } });
    console.log('User:', me.data.name, me.data.id);
    const pages = await axios.get(`${baseUrl}/me/accounts`, { params: { access_token: token } });
    console.log('Pages Count:', pages.data.data.length);
  } catch (e) { console.log('Fail'); }
}
debug();
