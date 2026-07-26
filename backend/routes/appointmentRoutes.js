const express = require('express');
const {
  createAppointment, getAppointments, getAppointmentById, updateAppointment, cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), getAppointments)
  .post(authorize('admin', 'receptionist', 'patient'), createAppointment);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), getAppointmentById)
  .put(authorize('admin', 'doctor', 'receptionist'), updateAppointment);

router.put('/:id/cancel', authorize('admin', 'doctor', 'receptionist', 'patient'), cancelAppointment);

module.exports = router;