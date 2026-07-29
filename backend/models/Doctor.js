const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
    slotDurationMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    qualifications: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true, default: 0 },
    department: { type: String },
    availability: [availabilitySlotSchema],
    isAvailable: { type: Boolean, default: true }, // toggled by doctor (on leave etc.)
    isActive: { type: Boolean, default: true }, // soft-delete flag, set false when admin removes a doctor
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);