const express = require('express');
const {
  createBill, getBills, getBillById, recordPayment, getBillingSummary,
  createRazorpayOrder, verifyRazorpayPayment, getDoctorEarnings,
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/summary', authorize('admin'), getBillingSummary);
router.get('/doctor-earnings', authorize('admin'), getDoctorEarnings);

router
  .route('/')
  .get(authorize('admin', 'receptionist', 'patient'), getBills)
  .post(authorize('admin', 'receptionist'), createBill);

router.get('/:id', authorize('admin', 'receptionist', 'patient'), getBillById);
router.put('/:id/pay', authorize('admin', 'receptionist'), recordPayment);

// Online payment (Razorpay)
router.post('/:id/create-order', authorize('admin', 'receptionist', 'patient'), createRazorpayOrder);
router.post('/:id/verify-payment', authorize('admin', 'receptionist', 'patient'), verifyRazorpayPayment);

module.exports = router;