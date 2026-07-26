const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');

const createPrescription = asyncHandler(async (req, res) => {
  const doctorId = req.user.role === 'doctor' ? req.user.doctorProfile : req.body.doctor;

  const prescription = await Prescription.create({ ...req.body, doctor: doctorId });
  res.status(201).json({ success: true, data: prescription });
});

const getPrescriptions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.doctor) filter.doctor = req.query.doctor;

  if (req.user.role === 'doctor') filter.doctor = req.user.doctorProfile;
  if (req.user.role === 'patient') filter.patient = req.user.patientProfile;

  const prescriptions = await Prescription.find(filter)
    .populate('patient', 'name phone')
    .populate({ path: 'doctor', select: 'name specialization' })
    .sort('-createdAt');

  res.json({ success: true, count: prescriptions.length, data: prescriptions });
});

const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  res.json({ success: true, data: prescription });
});

const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  if (req.user.role === 'doctor' && String(prescription.doctor) !== String(req.user.doctorProfile)) {
    res.status(403);
    throw new Error('You can only edit prescriptions you issued');
  }

  Object.assign(prescription, req.body);
  await prescription.save();
  res.json({ success: true, data: prescription });
});

module.exports = { createPrescription, getPrescriptions, getPrescriptionById, updatePrescription };