import mongoose from 'mongoose';
import { Post } from '../src/models/schemas';
import dotenv from 'dotenv';

dotenv.config();

async function checkPosts() {
  await mongoose.connect(process.env.MONGO_URI!);
  const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(5);
  console.log('Recent Posts:');
  recentPosts.forEach(post => {
    console.log(`- ID: ${post._id}, Status: ${post.status}, Platform: ${post.platform}`);
    console.log(`  Image URL: ${post.imageUrl}`);
    console.log(`  Caption: ${post.caption?.substring(0, 50)}...`);
  });
  await mongoose.disconnect();
}

checkPosts();
