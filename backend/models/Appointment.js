const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledReason: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);