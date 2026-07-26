import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdPayments } from 'react-icons/md';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyItem = { description: '', quantity: 1, unitPrice: 0 };
const statusColors = { unpaid: 'bg-red-100 text-red-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' };

const Billing = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient: '', items: [{ ...emptyItem }], tax: 0, discount: 0 });
  const [payingBill, setPayingBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const canManage = ['admin', 'receptionist'].includes(user.role);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/billing');
      setBills(data.data);
    } catch (err) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    if (canManage) {
      api.get('/patients?limit=100').then((r) => setPatients(r.data.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = field === 'description' ? value : Number(value);
    setForm({ ...form, items });
  };

  const addItemRow = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing', form);
      toast.success('Invoice generated');
      setShowForm(false);
      setForm({ patient: '', items: [{ ...emptyItem }], tax: 0, discount: 0 });
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/billing/${payingBill._id}/pay`, { amount: payAmount, paymentMethod: 'cash' });
      toast.success('Payment recorded');
      setPayingBill(null);
      setPayAmount('');
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  // --- Online payment via Razorpay ---
  const payOnline = async (bill) => {
    try {
      const { data } = await api.post(`/billing/${bill._id}/create-order`);
      const order = data.data;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MediCore Hospital',
        description: `Payment for invoice ${order.invoiceNumber}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post(`/billing/${bill._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            fetchBills();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#1c7d76' },
      };

      if (!window.Razorpay) {
        toast.error('Payment gateway failed to load. Check your internet connection.');
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950">Billing</h1>
          <p className="text-brand-700 text-sm">Invoices and payments</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <MdAdd /> Generate Invoice
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-100 text-brand-900 text-left">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id} className="border-t border-brand-100 hover:bg-brand-50">
                  <td className="px-4 py-3 font-mono text-xs">{b.invoiceNumber}</td>
                  <td className="px-4 py-3">{b.patient?.name}</td>
                  <td className="px-4 py-3">₹{b.grandTotal}</td>
                  <td className="px-4 py-3">₹{b.amountPaid}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[b.paymentStatus]}`}>{b.paymentStatus}</span></td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    {canManage && b.paymentStatus !== 'paid' && (
                      <button onClick={() => { setPayingBill(b); setPayAmount(''); }} className="text-brand-600 hover:underline text-xs font-medium">
                        Record Payment
                      </button>
                    )}
                    {user.role === 'patient' && b.paymentStatus !== 'paid' && (
                      <button onClick={() => payOnline(b)} className="text-emerald-600 hover:underline text-xs font-medium inline-flex items-center gap-1">
                        <MdPayments size={14} /> Pay Online
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-500">No bills found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl p-6 relative my-8">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-brand-500 hover:text-brand-800">
              <MdClose size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Generate Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Patient</label>
                <select className="input" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>)}
                </select>
              </div>

              <div>
                <label className="label">Line Items</label>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-6 gap-2">
                      <input className="input col-span-3" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required />
                      <input className="input col-span-1" type="number" min={1} placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                      <input className="input col-span-2" type="number" min={0} placeholder="Unit Price (₹)" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItemRow} className="text-brand-600 text-sm font-medium mt-2">+ Add line item</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tax (₹)</label>
                  <input className="input" type="number" min={0} value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Discount (₹)</label>
                  <input className="input" type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payingBill && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-1">Record Payment</h2>
            <p className="text-sm text-brand-600 mb-4">
              Balance due: ₹{payingBill.grandTotal - payingBill.amountPaid}
            </p>
            <form onSubmit={submitPayment}>
              <label className="label">Amount (₹)</label>
              <input className="input mb-4" type="number" min={1} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setPayingBill(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Billing;