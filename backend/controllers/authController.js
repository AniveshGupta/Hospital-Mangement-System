const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');

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

  let assignedRole = 'patient';
  if (req.user && req.user.role === 'admin' && role) {
    assignedRole = role;
  }

  const user = await User.create({ name, email, password, phone, role: assignedRole });

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

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

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