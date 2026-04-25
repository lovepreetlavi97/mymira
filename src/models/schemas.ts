import { Schema, model } from 'mongoose';

const postSchema = new Schema({
  type: { type: String, enum: ['image', 'reel', 'story'], required: true },
  theme: { type: String, required: true },
  caption: { type: String },
  localPath: { type: String },
  igMediaId: { type: String },
  status: { type: String, enum: ['pending', 'generated', 'posted', 'failed'], default: 'pending' },
  archived8kPath: { type: String },
  analytics: {
    likes: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  scheduledFor: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Post = model('Post', postSchema);

const leadSchema = new Schema({
  email: { type: String, required: true },
  type: { type: String, enum: ['vip', 'sponsor'], required: true },
  message: { type: String },
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

export const Lead = model('Lead', leadSchema);
