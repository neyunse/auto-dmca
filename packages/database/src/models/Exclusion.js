import mongoose from 'mongoose';

const ExclusionSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  type: { type: String, enum: ['keyword', 'domain', 'url'], default: 'keyword' },
  createdAt: { type: Date, default: Date.now }
});

export const Exclusion = mongoose.models.Exclusion || mongoose.model('Exclusion', ExclusionSchema);
