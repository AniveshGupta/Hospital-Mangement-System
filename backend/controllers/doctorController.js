const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const getDoctors = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.specialization) filter.specialization = new RegExp(req.query.specialization, 'i');
  if (req.query.department) filter.department = new RegExp(req.query.department, 'i');

  const doctors = await Doctor.find(filter).populate('user', 'name email phone isActive');
  res.json({ success: true, count: doctors.length, data: doctors });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name email phone isActive');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json({ success: true, data: doctor });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (req.user.role === 'doctor' && String(doctor.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only update your own doctor profile');
  }

  Object.assign(doctor, req.body);
  await doctor.save();
  res.json({ success: true, data: doctor });
});

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

module.exports = { getDoctors, getDoctorById, updateDoctor, getDoctorAvailability };