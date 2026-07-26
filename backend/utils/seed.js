require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany(), Doctor.deleteMany(), Patient.deleteMany()]);

  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@hms.com',
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    phone: '6387562654',
  });

  const doctorUser = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'doctor@hms.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '8888888888',
  });

  const doctor = await Doctor.create({
    user: doctorUser._id,
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD Cardiology'],
    experienceYears: 8,
    consultationFee: 500,
    department: 'Cardiology',
    availability: [
      { day: 'monday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'wednesday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'friday', startTime: '14:00', endTime: '18:00', slotDurationMinutes: 30 },
    ],
  });
  doctorUser.doctorProfile = doctor._id;
  await doctorUser.save();

  const patientUser = await User.create({
    name: 'John Doe',
    email: 'patient@hms.com',
    password: 'Patient@123',
    role: 'patient',
    phone: '7777777777',
  });

  const patient = await Patient.create({
    user: patientUser._id,
    name: 'John Doe',
    email: 'patient@hms.com',
    phone: '7777777777',
    gender: 'male',
    bloodGroup: 'O+',
  });
  patientUser.patientProfile = patient._id;
  await patientUser.save();

  console.log('Seed data created:');
  console.log('  Admin account created successfully');
  console.log('  Doctor   -> doctor@hms.com  / Doctor@123');
  console.log('  Patient  -> patient@hms.com / Patient@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});