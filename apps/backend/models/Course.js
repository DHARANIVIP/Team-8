import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true }, // e.g. 'Coursera', 'Udemy'
  url: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  price: { type: Number, default: 0 }, // 0 means free
  rating: { type: Number },
  targetSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;
