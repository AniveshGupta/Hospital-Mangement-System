const express = require('express');
const {
  getDoctors, getDoctorById, updateDoctor, getDoctorAvailability,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

router.put('/:id', protect, authorize('admin', 'doctor'), updateDoctor);

module.exports = router;