import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ServiceBooking } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Store,
  Home,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  RefreshCw,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface CustomerBookingsViewProps {
  openAuth: () => void;
  onExploreServices: () => void;
}

export const CustomerBookingsView: React.FC<CustomerBookingsViewProps> = ({
  openAuth,
  onExploreServices
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');

  // Reschedule Modal State
  const [rescheduleBooking, setRescheduleBooking] = useState<ServiceBooking | null>(null);
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [rescheduleSlots, setRescheduleSlots] = useState<{ timeSlot: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Cancel Modal State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<ServiceBooking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await request<{ bookings: ServiceBooking[] }>('/services/bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Load available slots when Reschedule date changes
  useEffect(() => {
    if (!rescheduleBooking) return;
    const loadSlots = async () => {
      setRescheduleLoading(true);
      try {
        const data = await request<{ slots: { timeSlot: string; isAvailable: boolean }[] }>(
          `/services/slots?providerId=${rescheduleBooking.providerId}&date=${newDate}`
        );
        setRescheduleSlots(data.slots || []);
        const avail = data.slots.find((s) => s.isAvailable);
        setSelectedSlot(avail ? avail.timeSlot : '');
      } catch (err) {
        console.error('Error loading slots for reschedule:', err);
      } finally {
        setRescheduleLoading(false);
      }
    };
    loadSlots();
  }, [rescheduleBooking, newDate]);

  const handleConfirmReschedule = async () => {
    if (!rescheduleBooking || !selectedSlot) return;
    setRescheduleSubmitting(true);
    try {
      await request(`/services/bookings/${rescheduleBooking.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          bookingDate: newDate,
          timeSlot: selectedSlot
        })
      });
      setRescheduleBooking(null);
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelBookingId) return;
    setCancelSubmitting(true);
    try {
      await request(`/services/bookings/${cancelBookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Customer requested cancellation' })
      });
      setCancelBookingId(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewBooking) return;
    setReviewSubmitting(true);
    try {
      await request(`/services/bookings/${reviewBooking.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: reviewComment.trim() || undefined
        })
      });
      setReviewBooking(null);
      setReviewComment('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Sign in to view your appointments</h2>
        <p className="text-xs text-slate-500 mb-6">
          Track upcoming salon visits, home repairs, cleanings and leave verified reviews.
        </p>
        <button
          onClick={openAuth}
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition shadow-sm"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) =>
    !['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status)
  );
  const currentList = activeTab === 'UPCOMING' ? upcomingBookings : pastBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PROVIDER_ASSIGNED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PROVIDER_EN_ROUTE':
      case 'ARRIVED':
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-500" />
              <span>My Service Appointments</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage your local bookings, track technicians and schedule reschedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-200 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onExploreServices}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book New Service</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`pb-3 text-sm font-black transition relative ${
              activeTab === 'UPCOMING'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Upcoming Appointments ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-3 text-sm font-black transition relative ${
              activeTab === 'HISTORY'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Past & Completed ({pastBookings.length})
          </button>
        </div>

        {/* Booking Cards List */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading your appointments...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 mb-1">
              No {activeTab.toLowerCase()} appointments found
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Need a salon cut, AC servicing, house deep-cleaning or car wash at your doorstep?
            </p>
            <button
              onClick={onExploreServices}
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Explore Indore Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
              >
                {/* Top Row: Booking ID, Status, and Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {booking.bookingNumber}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {booking.bookingDate}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {booking.timeSlot}
                    </span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Service & Provider */}
                  <div className="md:col-span-2">
                    <h3 className="text-base font-black text-slate-950 mb-0.5">
                      {booking.service?.title || 'Booked Service'}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mb-2">
                      by {booking.provider?.businessName}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {booking.fulfillmentType === 'SHOP_VISIT' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                          <Store className="w-3.5 h-3.5" />
                          Shop Visit: {booking.provider?.shopAddressLine || 'Indore Studio'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                          <Home className="w-3.5 h-3.5" />
                          Doorstep: {booking.customerAddressLine || booking.customerLocality || 'Customer Address'}
                        </span>
                      )}

                      {booking.staff && (
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          Specialist: {booking.staff.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Total */}
                  <div className="flex md:flex-col justify-between md:justify-center md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">Total Paid / Due</span>
                    <span className="text-lg font-black text-slate-950">
                      ₹{(booking.totalAmountPaise / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {booking.paymentStatus === 'PAID' ? '✓ Paid Online' : 'Pay at Appointment'}
                    </span>
                  </div>
                </div>

                {/* Action Controls & Review */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {booking.status === 'CONFIRMED' && (
                      <span className="text-emerald-700 font-semibold">
                        Slot confirmed. Please arrive or be available at your doorstep on time.
                      </span>
                    )}
                    {booking.status === 'PROVIDER_EN_ROUTE' && (
                      <span className="text-amber-700 font-bold animate-pulse">
                        Specialist is currently travelling to your address.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reschedule Button */}
                    {['CONFIRMED', 'PENDING_CONFIRMATION', 'PROVIDER_ASSIGNED'].includes(booking.status) && (
                      <button
                        onClick={() => {
                          setRescheduleBooking(booking);
                          setNewDate(booking.bookingDate);
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                      >
                        Reschedule
                      </button>
                    )}

                    {/* Cancel Button */}
                    {['CONFIRMED', 'PENDING_CONFIRMATION'].includes(booking.status) && (
                      <button
                        onClick={() => setCancelBookingId(booking.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Review Button */}
                    {booking.status === 'COMPLETED' && !booking.review && (
                      <button
                        onClick={() => {
                          setReviewBooking(booking);
                          setRating(5);
                          setReviewComment('');
                        }}
                        className="text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Rate & Review</span>
                      </button>
                    )}

                    {/* Already Reviewed Pill */}
                    {booking.review && (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Your Rating: {booking.review.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* RESCHEDULE MODAL */}
      {/* ==================================================== */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-950 mb-1">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a new date and time for {rescheduleBooking.service?.title}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1.5">New Date</label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const iso = d.toISOString().split('T')[0];
                    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setNewDate(iso)}
                        className={`flex-1 py-2 text-center rounded-xl text-xs font-black transition border ${
                          newDate === iso
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1.5">New Time Slot</label>
                {rescheduleLoading ? (
                  <div className="text-center py-4 text-xs text-slate-500">Checking slot availability...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rescheduleSlots.map((s) => (
                      <button
                        key={s.timeSlot}
                        type="button"
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.timeSlot)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                          !s.isAvailable
                            ? 'bg-slate-100 text-slate-400 line-through border-slate-200 cursor-not-allowed'
                            : selectedSlot === s.timeSlot
                            ? 'bg-amber-400 text-slate-950 border-amber-500'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {s.timeSlot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rescheduleSubmitting || !selectedSlot}
                onClick={handleConfirmReschedule}
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm New Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CANCEL MODAL */}
      {/* ==================================================== */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-950 mb-1">Cancel Appointment?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel this booking? This will free up the time slot.
            </p>

            <textarea
              rows={3}
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelBookingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleConfirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition"
              >
                {cancelSubmitting ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* RATE & REVIEW MODAL */}
      {/* ==================================================== */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-950 mb-1">Rate Your Experience</h3>
            <p className="text-xs text-slate-500 mb-4">
              How was your service with {reviewBooking.provider?.businessName}?
            </p>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 py-4 mb-4 bg-amber-50 rounded-2xl border border-amber-200">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Share details of your experience (cleanliness, punctuality, skill)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={handleConfirmReview}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition"
              >
                {reviewSubmitting ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
