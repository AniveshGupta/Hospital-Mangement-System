const express = require('express');
const {
  createPatient, getPatients, getPatientById, updatePatient, deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'receptionist'), getPatients)
  .post(authorize('admin', 'receptionist'), createPatient);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'patient'), getPatientById)
  .put(authorize('admin', 'receptionist'), updatePatient)
  .delete(authorize('admin'), deletePatient);

module.exports = router;