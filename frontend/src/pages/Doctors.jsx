import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdEventAvailable, MdAdd, MdClose } from 'react-icons/md';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyDoctorForm = {
  name: '', email: '', password: '', phone: '',
  specialization: '', department: '', experienceYears: 0, consultationFee: 0,
  qualifications: '',
  availability: [{ day: 'monday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }],
};

const Doctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [justBookedBill, setJustBookedBill] = useState(null);

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors');
      setDoctors(data.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const openBooking = (doc) => {
    setBookingDoctor(doc);
    setDate('');
    setSlots([]);
    setReason('');
  };

  const loadSlots = async (selectedDate) => {
    setDate(selectedDate);
    if (!selectedDate) return;
    setSlotLoading(true);
    try {
      const { data } = await api.get(`/doctors/${bookingDoctor._id}/availability?date=${selectedDate}`);
      setSlots(data.data);
    } catch (err) {
      toast.error('Could not load slots');
    } finally {
      setSlotLoading(false);
    }
  };

  const bookSlot = async (startTime) => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const endMinutes = h * 60 + m + 30;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      const { data } = await api.post('/appointments', {
        patient: user.patientProfile,
        doctor: bookingDoctor._id,
        date,
        startTime,
        endTime,
        reason: reason || 'General consultation',
      });

      toast.success('Appointment booked!');
      setBookingDoctor(null);
      setJustBookedBill(data.data.bill);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

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
            setJustBookedBill(null);
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

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm({ ...doctorForm, [name]: value });
  };

  const updateAvailabilityRow = (idx, field, value) => {
    const rows = [...doctorForm.availability];
    rows[idx][field] = field === 'slotDurationMinutes' ? Number(value) : value;
    setDoctorForm({ ...doctorForm, availability: rows });
  };

  const addAvailabilityRow = () => {
    setDoctorForm({
      ...doctorForm,
      availability: [...doctorForm.availability, { day: 'monday', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }],
    });
  };

  const removeAvailabilityRow = (idx) => {
    setDoctorForm({ ...doctorForm, availability: doctorForm.availability.filter((_, i) => i !== idx) });
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSavingDoctor(true);
    try {
      await api.post('/auth/create-doctor', {
        ...doctorForm,
        experienceYears: Number(doctorForm.experienceYears),
        consultationFee: Number(doctorForm.consultationFee),
        qualifications: doctorForm.qualifications
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean),
      });
      toast.success('Doctor added successfully');
      setShowAddDoctor(false);
      setDoctorForm(emptyDoctorForm);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setSavingDoctor(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950">Doctors</h1>
          <p className="text-brand-700 text-sm">Browse specialists and check availability</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowAddDoctor(true)} className="btn-primary flex items-center gap-2">
            <MdAdd /> Add Doctor
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div key={doc._id} className="card p-5">
              <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
                <MdLocalHospital className="text-white" size={22} />
              </div>
              <h3 className="font-semibold text-ink">{doc.name}</h3>
              <p className="text-sm text-brand-600">{doc.specialization}</p>
              <p className="text-xs text-brand-500 mt-1">{doc.experienceYears} yrs experience &middot; {doc.department}</p>
              <p className="text-sm font-medium mt-2">Fee: ₹{doc.consultationFee}</p>
              <span className={`badge mt-2 ${doc.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {doc.isAvailable ? 'Accepting Patients' : 'Unavailable'}
              </span>
              {user.role === 'patient' && (
                <button
                  onClick={() => openBooking(doc)}
                  disabled={!doc.isAvailable}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
                >
                  <MdEventAvailable /> Book Appointment
                </button>
              )}
            </div>
          ))}
          {doctors.length === 0 && (
            <p className="text-brand-500 col-span-full text-center py-10">No doctors found</p>
          )}
        </div>
      )}

      {bookingDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Book with {bookingDoctor.name}</h2>
            <p className="text-sm text-brand-600 mb-4">{bookingDoctor.specialization}</p>

            <label className="label">Select Date</label>
            <input type="date" className="input mb-4" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => loadSlots(e.target.value)} />

            <label className="label">Reason for visit</label>
            <input className="input mb-4" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Routine checkup" />

            {slotLoading && <Loader label="Checking availability..." />}

            {!slotLoading && date && (
              <div>
                <label className="label">Available Slots</label>
                {slots.length === 0 ? (
                  <p className="text-sm text-brand-500">No slots available on this date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button key={s} onClick={() => bookSlot(s)} className="btn-secondary text-sm !py-1.5">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setBookingDoctor(null)} className="btn-secondary w-full mt-6">Close</button>
          </div>
        </div>
      )}

      {justBookedBill && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
          <div className="card w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold mb-1">Appointment Confirmed 🎉</h2>
            <p className="text-sm text-brand-600 mb-4">
              Consultation fee: <span className="font-semibold">₹{justBookedBill.grandTotal}</span>
            </p>
            <p className="text-sm text-brand-700 mb-6">How would you like to pay?</p>

            <button onClick={() => payOnline(justBookedBill)} className="btn-primary w-full mb-3">
              Pay Online Now
            </button>
            <button onClick={() => setJustBookedBill(null)} className="btn-secondary w-full">
              Pay at Hospital Later
            </button>
          </div>
        </div>
      )}

      {showAddDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl p-6 relative my-8">
            <button onClick={() => setShowAddDoctor(false)} className="absolute top-4 right-4 text-brand-500 hover:text-brand-800">
              <MdClose size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add New Doctor</h2>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" name="name" value={doctorForm.name} onChange={handleDoctorFormChange} required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" name="phone" value={doctorForm.phone} onChange={handleDoctorFormChange} required />
                </div>
                <div>
                  <label className="label">Login Email</label>
                  <input className="input" type="email" name="email" value={doctorForm.email} onChange={handleDoctorFormChange} required />
                </div>
                <div>
                  <label className="label">Login Password</label>
                  <input className="input" type="password" name="password" value={doctorForm.password} onChange={handleDoctorFormChange} required minLength={6} />
                </div>
                <div>
                  <label className="label">Specialization</label>
                  <input className="input" name="specialization" value={doctorForm.specialization} onChange={handleDoctorFormChange} required placeholder="e.g. Cardiology" />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" name="department" value={doctorForm.department} onChange={handleDoctorFormChange} />
                </div>
                <div>
                  <label className="label">Experience (years)</label>
                  <input className="input" type="number" min={0} name="experienceYears" value={doctorForm.experienceYears} onChange={handleDoctorFormChange} />
                </div>
                <div>
                  <label className="label">Consultation Fee (₹)</label>
                  <input className="input" type="number" min={0} name="consultationFee" value={doctorForm.consultationFee} onChange={handleDoctorFormChange} />
                </div>
              </div>

              <div>
                <label className="label">Qualifications (comma-separated)</label>
                <input className="input" name="qualifications" value={doctorForm.qualifications} onChange={handleDoctorFormChange} placeholder="MBBS, MD Cardiology" />
              </div>

              <div>
                <label className="label">Weekly Availability</label>
                <div className="space-y-2">
                  {doctorForm.availability.map((row, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                      <select className="input" value={row.day} onChange={(e) => updateAvailabilityRow(i, 'day', e.target.value)}>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input className="input" type="time" value={row.startTime} onChange={(e) => updateAvailabilityRow(i, 'startTime', e.target.value)} />
                      <input className="input" type="time" value={row.endTime} onChange={(e) => updateAvailabilityRow(i, 'endTime', e.target.value)} />
                      <input className="input" type="number" min={10} step={5} value={row.slotDurationMinutes} onChange={(e) => updateAvailabilityRow(i, 'slotDurationMinutes', e.target.value)} placeholder="Slot mins" />
                      <button type="button" onClick={() => removeAvailabilityRow(i)} className="text-red-600 text-xs font-medium">Remove</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addAvailabilityRow} className="text-brand-600 text-sm font-medium mt-2">+ Add another day</button>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddDoctor(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={savingDoctor} className="btn-primary">
                  {savingDoctor ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Doctors;