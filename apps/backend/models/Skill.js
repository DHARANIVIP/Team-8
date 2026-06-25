import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // e.g. 'Technical', 'Soft', 'Analytical'
  description: { type: String },
  difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
}, { timestamps: true });

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
