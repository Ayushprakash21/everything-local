import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { ServiceProvider, ServiceListing, ProviderStaff, ServiceBooking } from '../../types';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Home,
  Store,
  User,
  Users,
  ChevronRight,
  Sparkles,
  Phone,
  Share2,
  Info
} from 'lucide-react';

interface ServiceProviderDetailViewProps {
  providerId: string;
  onBack: () => void;
  onBookingSuccess: (booking: ServiceBooking) => void;
  openAuth: () => void;
}

export const ServiceProviderDetailView: React.FC<ServiceProviderDetailViewProps> = ({
  providerId,
  onBack,
  onBookingSuccess,
  openAuth
}) => {
  const { user } = useAuth();
  const { selectedLocation } = useLocation();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<'SHOP_VISIT' | 'HOME_VISIT'>('SHOP_VISIT');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<{ timeSlot: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [locality, setLocality] = useState(selectedLocation?.locality || 'Palasia');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load Provider Detail
  const fetchProviderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedLocation?.coordinates) {
        queryParams.append('lat', selectedLocation.coordinates.latitude.toString());
        queryParams.append('lng', selectedLocation.coordinates.longitude.toString());
      }
      const data = await request<{ provider: ServiceProvider }>(`/services/providers/${providerId}?${queryParams.toString()}`);
      setProvider(data.provider);
      if (selectedLocation?.locality) {
        setLocality(selectedLocation.locality);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service provider details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderDetail();
  }, [providerId, selectedLocation]);

  // Load Slots when Date or Provider changes
  useEffect(() => {
    if (!selectedService || !provider) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await request<{ slots: { timeSlot: string; isAvailable: boolean }[] }>(
          `/services/slots?providerId=${provider.id}&date=${selectedDate}`
        );
        setAvailableSlots(data.slots || []);
        // Pick first available slot by default if current selection is not available
        const firstAvailable = data.slots.find((s) => s.isAvailable);
        setSelectedSlot(firstAvailable ? firstAvailable.timeSlot : '');
      } catch (err) {
        console.error('Error loading slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedService, selectedDate, provider?.id]);

  const handleOpenBookingModal = (service: ServiceListing) => {
    if (!user) {
      openAuth();
      return;
    }
    setSelectedService(service);
    // Auto-select preferred fulfillment
    if (service.allowsShopVisit && !service.allowsHomeVisit) {
      setFulfillmentType('SHOP_VISIT');
    } else if (!service.allowsShopVisit && service.allowsHomeVisit) {
      setFulfillmentType('HOME_VISIT');
    } else {
      setFulfillmentType('SHOP_VISIT');
    }
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      openAuth();
      return;
    }
    if (!selectedService || !provider) return;
    if (!selectedSlot) {
      setBookingError('Please choose an available appointment time slot');
      return;
    }

    if (fulfillmentType === 'HOME_VISIT' && !addressLine.trim()) {
      setBookingError('Please enter your complete address for home visit');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const payload = {
        providerId: provider.id,
        serviceId: selectedService.id,
        staffId: selectedStaffId || undefined,
        fulfillmentType,
        bookingDate: selectedDate,
        timeSlot: selectedSlot,
        customerAddressLine: fulfillmentType === 'HOME_VISIT' ? addressLine : undefined,
        customerLocality: fulfillmentType === 'HOME_VISIT' ? locality : undefined,
        customerCity: 'Indore',
        customerLat: selectedLocation?.coordinates?.latitude,
        customerLng: selectedLocation?.coordinates?.longitude,
        instructions: instructions.trim() || undefined
      };

      const res = await request<{ booking: ServiceBooking }>('/services/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSelectedService(null);
      onBookingSuccess(res.booking);
    } catch (err: any) {
      setBookingError(err.message || 'Unable to confirm appointment slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading specialist profile & catalogue...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Provider Not Found</h3>
        <p className="text-slate-600 mb-6">{error || 'This service provider profile could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>
      </div>
    );
  }

  // Calculate pricing breakdown in modal
  const servicePrice = selectedService ? selectedService.pricePaise / 100 : 0;
  const travelFee = fulfillmentType === 'HOME_VISIT' ? provider.homeVisitFeePaise / 100 : 0;
  const totalPrice = servicePrice + travelFee;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top sticky navigation bar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Services</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              Indore Verified
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Provider Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <img
                src={provider.profileImageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=60'}
                alt={provider.businessName}
                className="w-28 h-28 md:w-36 md:md:h-36 rounded-2xl object-cover border-2 border-slate-100 shadow-md"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                  {provider.businessName}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Specialist
                </span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-2xl">
                {provider.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 mb-4">
                <div className="flex items-center gap-1 bg-amber-400/20 text-slate-950 px-2.5 py-1 rounded-lg border border-amber-400/40">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-black text-sm">{provider.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({provider.reviewCount || 0} reviews)</span>
                </div>

                {provider.shopAddressLine && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>{provider.shopAddressLine}, {provider.shopCity}</span>
                  </div>
                )}

                {provider.distanceKm !== undefined && (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    📍 {provider.distanceKm.toFixed(1)} km away
                  </span>
                )}
              </div>

              {/* Fulfillment Capabilities */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {provider.hasShopVisit && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200">
                    <Store className="w-4 h-4 text-blue-700" />
                    <span>Shop Appointments Available</span>
                  </div>
                )}

                {provider.hasHomeVisit && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>Home Doorstep Visit Available ({provider.homeVisitRadiusKm} km coverage • ₹{provider.homeVisitFeePaise / 100} fee)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staff / Specialists Showcase */}
        {provider.staff && provider.staff.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>Certified Specialists ({provider.staff.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {provider.staff.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 shadow-xs">
                  <img
                    src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60'}
                    alt={member.name}
                    className="w-11 h-11 rounded-full object-cover border border-amber-400"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{member.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{member.role}</p>
                    <span className="text-[10px] text-amber-700 font-bold">{member.experienceYears}y exp</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Catalogue List */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-950 tracking-tight">Services & Pricing</h2>
              <p className="text-xs text-slate-500">Select a service to schedule your appointment</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              {provider.services?.length || 0} Available Services
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.services && provider.services.length > 0 ? (
              provider.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-amber-400/80 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-black text-base text-slate-950">{service.title}</h3>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-slate-950">
                          ₹{(service.pricePaise / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {service.description || 'Professional, standardized service backed by EveryBazaar assurance.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-semibold">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {service.durationMinutes} mins
                      </span>

                      {service.allowsShopVisit && (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md">
                          Shop Visit
                        </span>
                      )}

                      {service.allowsHomeVisit && (
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                          Doorstep Visit
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBookingModal(service)}
                    className="w-full bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 col-span-2">No active services listed yet.</p>
            )}
          </div>
        </div>

        {/* Verified Customer Reviews */}
        {provider.reviews && provider.reviews.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-8">
            <h2 className="text-lg font-black text-slate-950 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Verified Customer Reviews</span>
            </h2>

            <div className="divide-y divide-slate-100">
              {provider.reviews.map((rev) => (
                <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                        {rev.customer?.name ? rev.customer.name[0] : 'U'}
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {rev.customer?.name || 'Verified Customer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 pl-9">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* APPOINTMENT BOOKING DRAWER / MODAL */}
      {/* ==================================================== */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Schedule Appointment
                </span>
                <h3 className="text-lg font-black text-white">{selectedService.title}</h3>
                <p className="text-xs text-slate-300">
                  {provider.businessName} • {selectedService.durationMinutes} mins
                </p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Fulfillment Type Selection */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2">
                  Choose Visit Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!selectedService.allowsShopVisit}
                    onClick={() => setFulfillmentType('SHOP_VISIT')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      fulfillmentType === 'SHOP_VISIT'
                        ? 'border-amber-500 bg-amber-50/60 text-slate-950 ring-2 ring-amber-400/30'
                        : selectedService.allowsShopVisit
                        ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-black">Shop Visit</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Visit salon/studio • ₹0 extra</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedService.allowsHomeVisit || !provider.hasHomeVisit}
                    onClick={() => setFulfillmentType('HOME_VISIT')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      fulfillmentType === 'HOME_VISIT'
                        ? 'border-amber-500 bg-amber-50/60 text-slate-950 ring-2 ring-amber-400/30'
                        : selectedService.allowsHomeVisit && provider.hasHomeVisit
                        ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Home className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black">Doorstep Visit</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Home visit • +₹{provider.homeVisitFeePaise / 100}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Home Visit Address Input (Conditional) */}
              {fulfillmentType === 'HOME_VISIT' && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>Doorstep Service Address</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Radius: {provider.homeVisitRadiusKm} km max
                    </span>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Flat, House no., Apartment or Landmark *"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Locality (e.g. Vijay Nagar)"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      disabled
                      value="Indore, MP"
                      className="text-xs px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* 3. Date Selection */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2">
                  Select Appointment Date
                </label>
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
                        onClick={() => setSelectedDate(iso)}
                        className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-black transition border ${
                          selectedDate === iso
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

              {/* 4. Time Slot Selection */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2">
                  Available Time Slots ({selectedDate})
                </label>
                {slotsLoading ? (
                  <div className="py-4 text-center text-xs text-slate-500">Checking slot availability...</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.timeSlot}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.timeSlot)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                          !slot.isAvailable
                            ? 'bg-slate-100 text-slate-400 line-through border-slate-200 cursor-not-allowed'
                            : selectedSlot === slot.timeSlot
                            ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-400/30'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {slot.timeSlot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Preferred Specialist (Optional) */}
              {provider.staff && provider.staff.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-2">
                    Choose Specialist (Optional)
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Any Available Specialist</option>
                    {provider.staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 6. Special Instructions */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Special Instructions / Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring hypoallergenic cream, quiet session..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs p-3 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Error Alert */}
              {bookingError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Price Breakdown & Confirmation */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Service Fee:</span>
                  <span className="font-semibold">₹{servicePrice.toFixed(2)}</span>
                </div>
                {fulfillmentType === 'HOME_VISIT' && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Doorstep Travel Fee:</span>
                    <span className="font-semibold">₹{travelFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-amber-600">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting || !selectedSlot}
                onClick={handleConfirmBooking}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 rounded-2xl text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Securing Slot...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Schedule Appointment (₹{totalPrice.toFixed(0)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
