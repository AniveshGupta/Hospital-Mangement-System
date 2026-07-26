const express = require('express');
const { registerUser, loginUser, getMe, createDoctorAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/create-doctor', protect, authorize('admin'), createDoctorAccount);

module.exports = router;