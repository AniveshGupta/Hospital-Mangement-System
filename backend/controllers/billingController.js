const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Appointment = require('../models/Appointment');
const razorpay = require('../utils/razorpayInstance');

// @desc    Generate a new bill/invoice
// @route   POST /api/billing
// @access  Private/Admin,Receptionist
const createBill = asyncHandler(async (req, res) => {
  const { items = [], tax = 0, discount = 0 } = req.body;

  if (!items.length) {
    res.status(400);
    throw new Error('At least one line item is required');
  }

  // Sanitize each item: blank/invalid number fields become 0 instead of NaN,
  // and every item must have a non-empty description.
  const itemsWithTotal = items.map((item, idx) => {
    const description = (item.description || '').trim();
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;

    if (!description) {
      res.status(400);
      throw new Error(`Line item ${idx + 1} is missing a description`);
    }
    if (quantity <= 0) {
      res.status(400);
      throw new Error(`Line item "${description}" must have a quantity greater than 0`);
    }

    return { description, quantity, unitPrice, total: quantity * unitPrice };
  });

  const subTotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);
  const safeTax = Number(tax) || 0;
  const safeDiscount = Number(discount) || 0;
  const grandTotal = subTotal + safeTax - safeDiscount;

  const bill = await Bill.create({
    ...req.body,
    items: itemsWithTotal,
    tax: safeTax,
    discount: safeDiscount,
    subTotal,
    grandTotal,
    generatedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: bill });
});

// @desc    Get all bills (filterable by patient, payment status)
// @route   GET /api/billing
// @access  Private/Admin,Receptionist,Patient(own)
const getBills = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  if (req.user.role === 'patient') filter.patient = req.user.patientProfile;

  const bills = await Bill.find(filter).populate('patient', 'name phone').sort('-createdAt');
  res.json({ success: true, count: bills.length, data: bills });
});

// @desc    Get a single bill
// @route   GET /api/billing/:id
// @access  Private
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('patient').populate('appointment');
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  res.json({ success: true, data: bill });
});

// @desc    Record a payment against a bill
// @route   PUT /api/billing/:id/pay
// @access  Private/Admin,Receptionist
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  bill.amountPaid += Number(amount);
  if (paymentMethod) bill.paymentMethod = paymentMethod;

  if (bill.amountPaid >= bill.grandTotal) {
    bill.paymentStatus = 'paid';
  } else if (bill.amountPaid > 0) {
    bill.paymentStatus = 'partial';
  }

  await bill.save();
  res.json({ success: true, data: bill });
});

// @desc    Simple revenue summary for the dashboard
// @route   GET /api/billing/summary
// @access  Private/Admin
const getBillingSummary = asyncHandler(async (req, res) => {
  const bills = await Bill.find();
  const totalRevenue = bills.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalOutstanding = bills.reduce((sum, b) => sum + (b.grandTotal - b.amountPaid), 0);
  const totalBills = bills.length;
  const paidBills = bills.filter((b) => b.paymentStatus === 'paid').length;

  res.json({
    success: true,
    data: { totalRevenue, totalOutstanding, totalBills, paidBills },
  });
});

// @desc    Create a Razorpay order for the outstanding balance of a bill
// @route   POST /api/billing/:id/create-order
// @access  Private/Patient(own bill),Admin,Receptionist
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // A patient may only pay their own bill
  if (req.user.role === 'patient' && String(bill.patient) !== String(req.user.patientProfile)) {
    res.status(403);
    throw new Error('You can only pay your own bills');
  }

  const balanceDue = bill.grandTotal - bill.amountPaid;
  if (balanceDue <= 0) {
    res.status(400);
    throw new Error('This bill is already fully paid');
  }

  // Razorpay amount is in the smallest currency unit (paise for INR)
  const order = await razorpay.orders.create({
    amount: Math.round(balanceDue * 100),
    currency: 'INR',
    receipt: bill.invoiceNumber,
    notes: { billId: String(bill._id) },
  });

  bill.razorpayOrderId = order.id;
  await bill.save();

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      billId: bill._id,
      invoiceNumber: bill.invoiceNumber,
    },
  });
});

// @desc    Verify a Razorpay payment signature and mark the bill as paid
// @route   POST /api/billing/:id/verify-payment
// @access  Private/Patient(own bill),Admin,Receptionist
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  if (bill.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Order ID does not match this bill');
  }

  // Verify the payment signature using HMAC SHA256 (standard Razorpay verification)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed. Signature mismatch.');
  }

  // Signature is valid -> fetch the actual paid amount from Razorpay and record it
  const payment = await razorpay.payments.fetch(razorpay_payment_id);
  const paidAmount = payment.amount / 100; // convert paise back to rupees

  bill.amountPaid += paidAmount;
  bill.paymentMethod = 'online';
  bill.razorpayPaymentId = razorpay_payment_id;
  bill.paymentStatus = bill.amountPaid >= bill.grandTotal ? 'paid' : 'partial';
  await bill.save();

  res.json({ success: true, message: 'Payment verified and recorded', data: bill });
});

// @desc    Revenue generated per doctor from completed appointments (for manual payout reference)
// @route   GET /api/billing/doctor-earnings
// @access  Private/Admin
const getDoctorEarnings = asyncHandler(async (req, res) => {
  const bills = await Bill.find({ paymentStatus: { $in: ['paid', 'partial'] } }).populate({
    path: 'appointment',
    populate: { path: 'doctor', select: 'name specialization consultationFee' },
  });

  const earningsMap = {};

  for (const bill of bills) {
    const doctor = bill.appointment?.doctor;
    if (!doctor) continue; // bill wasn't linked to a specific appointment/doctor

    const key = String(doctor._id);
    if (!earningsMap[key]) {
      earningsMap[key] = {
        doctorId: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        totalCollected: 0,
        billCount: 0,
      };
    }
    earningsMap[key].totalCollected += bill.amountPaid;
    earningsMap[key].billCount += 1;
  }

  res.json({ success: true, data: Object.values(earningsMap) });
});

module.exports = {
  createBill,
  getBills,
  getBillById,
  recordPayment,
  getBillingSummary,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getDoctorEarnings,
};