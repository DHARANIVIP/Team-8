import mongoose from 'mongoose';

const careerPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  averageSalary: { type: Number },
  growthRate: { type: Number }, // e.g. 15 for 15% projected growth
  demandLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  requiredSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  topCompanies: [{ type: String }], // Used for querying finance/stock APIs
}, { timestamps: true });

const CareerPath = mongoose.model('CareerPath', careerPathSchema);
export default CareerPath;
