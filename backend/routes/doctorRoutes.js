const express = require('express');
const {
  getDoctors, getDoctorById, updateDoctor, getDoctorAvailability, deleteDoctor, restoreDoctor,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/', getDoctors); // public browsing
router.get('/:id', getDoctorById); // public
router.get('/:id/availability', getDoctorAvailability); // public

router.put('/:id', protect, authorize('admin', 'doctor'), updateDoctor);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);
router.put('/:id/restore', protect, authorize('admin'), restoreDoctor);

module.exports = router;