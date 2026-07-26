const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true }, // e.g. "Consultation Fee", "Lab Test - CBC"
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items: [billItemSchema],
    subTotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'insurance', 'upi', 'other', 'online'], default: 'cash' },
    amountPaid: { type: Number, default: 0 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invoiceNumber: { type: String, unique: true },
    // Online payment tracking (Razorpay)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

billSchema.pre('validate', function () {
  if (!this.invoiceNumber) {
    this.invoiceNumber =
      'INV-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.floor(Math.random() * 1000);
  }
});

module.exports = mongoose.model('Bill', billSchema);