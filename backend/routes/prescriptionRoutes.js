const express = require('express');
const {
  createPrescription, getPrescriptions, getPrescriptionById, updatePrescription,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'patient'), getPrescriptions)
  .post(authorize('doctor'), createPrescription);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'patient'), getPrescriptionById)
  .put(authorize('doctor', 'admin'), updatePrescription);

module.exports = router;