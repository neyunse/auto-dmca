import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Target',
    required: true
  },
  type: {
    type: String, // 'piracy', 'resale'
    required: true
  },
  status: {
    type: String, // 'pending', 'takedown', 'ignored'
    default: 'pending'
  },
  screenshotUrl: {
    type: String,
    default: null
  },
  abuseEmail: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  sentBody: {
    type: String,
    default: null
  },
  detectedAt: {
    type: Date,
    default: Date.now
  }
});

export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
