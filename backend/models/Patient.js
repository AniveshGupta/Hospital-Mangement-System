const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], default: 'unknown' },
    address: { type: String },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

patientSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Patient', patientSchema);