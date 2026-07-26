const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');

const createPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.create({ ...req.body, registeredBy: req.user._id });
  res.status(201).json({ success: true, data: patient });
});

const getPatients = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const total = await Patient.countDocuments(filter);
  const patients = await Patient.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    count: patients.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: patients,
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, data: patient });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, data: patient });
});

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json({ success: true, message: 'Patient deactivated successfully' });
});

module.exports = { createPatient, getPatients, getPatientById, updatePatient, deletePatient };