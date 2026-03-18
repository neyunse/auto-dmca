import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'query', 'domain'
    required: true
  },
  value: {
    type: String, // 'Roses Of Love', 'g2a.com'
    required: true
  },
  queryParam: {
    type: String, // 'q', 'search', 'query'
    default: 'q'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Target = mongoose.models.Target || mongoose.model('Target', targetSchema);
