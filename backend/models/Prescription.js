const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String, required: true },
    symptoms: [{ type: String }],
    medicines: [medicineSchema],
    labTests: [{ type: String }],
    advice: { type: String },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);