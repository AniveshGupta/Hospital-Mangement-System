const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (patient self-registration, or admin creates staff)
// @route   POST /api/auth/register
// @access  Public (role defaults to 'patient' unless created by an admin)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // Only an already-authenticated admin can create staff accounts (doctor/receptionist/admin).
  // Public registration always creates a 'patient' account.
  let assignedRole = 'patient';
  if (req.user && req.user.role === 'admin' && role) {
    assignedRole = role;
  }

  const user = await User.create({ name, email, password, phone, role: assignedRole });

  // Auto-create a linked profile document
  if (assignedRole === 'patient') {
    const patient = await Patient.create({ user: user._id, name, email, phone });
    user.patientProfile = patient._id;
    await user.save();
  }

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact the administrator.');
  }

  // Self-heal: if this is a patient account but somehow has no linked Patient profile
  // (e.g. created directly in the database instead of via /register), create one now
  // so booking/prescriptions/billing don't break with "Path `patient` is required".
  if (user.role === 'patient' && !user.patientProfile) {
    const patient = await Patient.create({
      user: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || 'not provided',
    });
    user.patientProfile = patient._id;
    await user.save();
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctorProfile: user.doctorProfile,
      patientProfile: user.patientProfile,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @desc    Admin creates a doctor account (User + Doctor profile in one step)
// @route   POST /api/auth/create-doctor
// @access  Private/Admin
const createDoctorAccount = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualifications, experienceYears, consultationFee, department, availability,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({ name, email, password, phone, role: 'doctor' });

  const doctor = await Doctor.create({
    user: user._id,
    name,
    specialization,
    qualifications,
    experienceYears,
    consultationFee,
    department,
    availability,
  });

  user.doctorProfile = doctor._id;
  await user.save();

  res.status(201).json({ success: true, data: { user, doctor } });
});

module.exports = { registerUser, loginUser, getMe, createDoctorAccount };