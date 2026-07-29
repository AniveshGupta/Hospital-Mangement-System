const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get all doctors (optionally filter by specialization/department)
// @route   GET /api/doctors?specialization=&department=&includeInactive=true
// @access  Public (patients can browse doctors)
const getDoctors = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.specialization) filter.specialization = new RegExp(req.query.specialization, 'i');
  if (req.query.department) filter.department = new RegExp(req.query.department, 'i');

  // By default only show active (not removed) doctors. Admin can pass
  // ?includeInactive=true to also see removed doctors (e.g. to restore one).
  if (req.query.includeInactive !== 'true') {
    filter.isActive = true;
  }

  const doctors = await Doctor.find(filter).populate('user', 'name email phone isActive');
  res.json({ success: true, count: doctors.length, data: doctors });
});

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email phone isActive');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json({ success: true, data: doctor });
});

// @desc    Update doctor profile (details, fee, availability slots, etc.)
// @route   PUT /api/doctors/:id
// @access  Private/Admin,Doctor(self)
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // A doctor may only edit their own profile; admin can edit any
  if (req.user.role === 'doctor' && String(doctor.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only update your own doctor profile');
  }

  // isActive is managed only through the dedicated remove/restore endpoints, not a generic edit
  const { isActive, ...allowedUpdates } = req.body;

  Object.assign(doctor, allowedUpdates);
  await doctor.save();
  res.json({ success: true, data: doctor });
});

// @desc    Remove a doctor (soft-delete: hides them from listings & disables their login)
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  doctor.isActive = false;
  doctor.isAvailable = false; // also stop them appearing as bookable
  await doctor.save();

  // Disable their login too, so a removed doctor can no longer sign in
  await User.findByIdAndUpdate(doctor.user, { isActive: false });

  res.json({ success: true, message: 'Doctor removed successfully' });
});

// @desc    Restore a previously removed doctor
// @route   PUT /api/doctors/:id/restore
// @access  Private/Admin
const restoreDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  doctor.isActive = true;
  await doctor.save();
  await User.findByIdAndUpdate(doctor.user, { isActive: true });

  res.json({ success: true, message: 'Doctor restored successfully', data: doctor });
});

// @desc    Get a doctor's available time slots for a given date, factoring in existing bookings
// @route   GET /api/doctors/:id/availability?date=YYYY-MM-DD
// @access  Public
const getDoctorAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('A date query parameter is required, e.g. ?date=2026-07-25');
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = doctor.availability.find((slot) => slot.day === dayName);

  if (!doctor.isAvailable || !daySchedule) {
    return res.json({ success: true, data: [] });
  }

  // Generate candidate slots
  const slots = [];
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH, endM] = daySchedule.endTime.split(':').map(Number);
  const duration = daySchedule.slotDurationMinutes || 30;

  let cursor = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (cursor + duration <= end) {
    const h = String(Math.floor(cursor / 60)).padStart(2, '0');
    const m = String(cursor % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cursor += duration;
  }

  // Remove already-booked slots
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const booked = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed'] },
  }).select('startTime');

  const bookedTimes = new Set(booked.map((b) => b.startTime));
  const availableSlots = slots.filter((s) => !bookedTimes.has(s));

  res.json({ success: true, date, day: dayName, data: availableSlots });
});

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  getDoctorAvailability,
  deleteDoctor,
  restoreDoctor,
};