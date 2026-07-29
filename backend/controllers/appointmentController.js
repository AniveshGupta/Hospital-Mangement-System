const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Bill = require('../models/Bill');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private/Admin,Receptionist,Patient
const createAppointment = asyncHandler(async (req, res) => {
  const { doctor, date, startTime, endTime, reason } = req.body;

  // If a patient is booking for themselves, always trust the server-side link
  // (req.user.patientProfile) rather than whatever the client sent — this also
  // protects against a stale/cached frontend session missing this field.
  const patient = req.user.role === 'patient' ? req.user.patientProfile : req.body.patient;

  if (!patient) {
    res.status(400);
    throw new Error('No patient profile is linked to this account. Please log out and log back in.');
  }

  const doctorDoc = await Doctor.findById(doctor);
  if (!doctorDoc) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  if (!doctorDoc.isAvailable) {
    res.status(400);
    throw new Error('This doctor is currently not accepting appointments');
  }

  // Double-booking guard (unique index also enforces this at the DB level)
  const clash = await Appointment.findOne({
    doctor,
    date,
    startTime,
    status: { $in: ['scheduled', 'confirmed'] },
  });
  if (clash) {
    res.status(409);
    throw new Error('This time slot has just been booked. Please choose another slot.');
  }

  const appointment = await Appointment.create({
    patient,
    doctor,
    date,
    startTime,
    endTime,
    reason,
    createdBy: req.user._id,
  });

  // Automatically generate a consultation-fee bill linked to this appointment,
  // so the patient can choose to pay online right away or settle it at the hospital later.
  const bill = await Bill.create({
    patient,
    appointment: appointment._id,
    items: [
      {
        description: `Consultation Fee - Dr. ${doctorDoc.name} (${doctorDoc.specialization})`,
        quantity: 1,
        unitPrice: doctorDoc.consultationFee,
        total: doctorDoc.consultationFee,
      },
    ],
    subTotal: doctorDoc.consultationFee,
    grandTotal: doctorDoc.consultationFee,
    generatedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: { appointment, bill } });
});

// @desc    Get appointments (filterable by doctor, patient, status, date range)
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.doctor) filter.doctor = req.query.doctor;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  // A logged-in doctor only sees their own appointments unless they're an admin
  if (req.user.role === 'doctor') {
    filter.doctor = req.user.doctorProfile;
  }
  // A logged-in patient only sees their own appointments
  if (req.user.role === 'patient') {
    filter.patient = req.user.patientProfile;
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name phone email')
    .populate({ path: 'doctor', select: 'name specialization consultationFee', populate: { path: 'user', select: 'email' } })
    .sort('-date -startTime');

  res.json({ success: true, count: appointments.length, data: appointments });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  res.json({ success: true, data: appointment });
});

// @desc    Update appointment status/details (confirm, complete, reschedule, add notes)
// @route   PUT /api/appointments/:id
// @access  Private/Admin,Doctor,Receptionist
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  Object.assign(appointment, req.body);
  await appointment.save();
  res.json({ success: true, data: appointment });
});

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  appointment.status = 'cancelled';
  appointment.cancelledReason = req.body.reason || 'No reason provided';
  await appointment.save();

  res.json({ success: true, data: appointment });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
};