import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import { MainContentContainer } from '../../components/layout/MainContentContainer';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  FileText,
  Upload,
  Search,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Plus,
  HeartPulse,
  Pill,
  Thermometer,
  Bandage,
  ChevronRight,
  Shield
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  brand: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  manufacturer: string;
  mrpPaise: number;
  sellingPricePaise: number;
  classification: string;
  requiresPrescription: boolean;
  storageRequirement?: string;
  imageUrl?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  legalBusinessName: string;
  addressLine: string;
  city: string;
  pincode: string;
  phone: string;
  operatingHours: string;
  distanceKm: number;
  isServiceable: boolean;
  activePharmacist?: {
    name: string;
    registrationNumber: string;
    qualification: string;
  };
  activeLicences?: Array<{
    licenceType: string;
    licenceNumber: string;
  }>;
}

interface PharmacyHomeViewProps {
  onOpenPrescriptionUpload: () => void;
  onOpenMyPrescriptions: () => void;
  onOpenPharmacistConsole?: () => void;
  openAuth: () => void;
}

export const PharmacyHomeView: React.FC<PharmacyHomeViewProps> = ({
  onOpenPrescriptionUpload,
  onOpenMyPrescriptions,
  onOpenPharmacistConsole,
  openAuth
}) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PRESCRIPTION' | 'OTC' | 'DEVICES' | 'FIRST_AID'>('ALL');

  useEffect(() => {
    const fetchPharmacyData = async () => {
      setLoading(true);
      try {
        const [medsRes, pharRes] = await Promise.all([
          request<{ medicines: Medicine[] }>('/pharmacy/medicines'),
          request<{ pharmacies: Pharmacy[] }>('/pharmacy/licensed-pharmacies?lat=22.7196&lng=75.8577')
        ]);
        setMedicines(medsRes.medicines || []);
        setPharmacies(pharRes.pharmacies || []);
      } catch (err) {
        console.error('Failed to load pharmacy data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacyData();
  }, []);

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'PRESCRIPTION') return med.requiresPrescription;
    if (selectedFilter === 'OTC') return !med.requiresPrescription && med.classification === 'OTC';
    if (selectedFilter === 'DEVICES') return med.classification === 'MEDICAL_DEVICE';
    if (selectedFilter === 'FIRST_AID') return med.classification === 'FIRST_AID';

    return true;
  });

  const isPharmacistUser =
    user?.role === 'MERCHANT' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PHARMACIST' ||
    user?.email?.includes('pharmacist');

  return (
    <MainContentContainer className="py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Regulatory Compliance Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-800 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-forest-700 text-emerald-100 px-2.5 py-0.5 rounded-full">
                Licensed Chemist Network
              </span>
              <span className="text-xs font-bold text-amber-300">Indore, Madhya Pradesh</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Dispensed strictly under registered pharmacist supervision in compliance with Drugs and Cosmetics Rules, 1945.
            </p>
          </div>
        </div>

        {isPharmacistUser && onOpenPharmacistConsole && (
          <button
            onClick={onOpenPharmacistConsole}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Open Pharmacist Review Console</span>
          </button>
        )}
      </div>

      {/* 2. Hero Section with Prominent Prescription Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Banner */}
        <div className="lg:col-span-7 bg-gradient-to-br from-teal-900 via-teal-800 to-forest-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Indore Licensed Pharmacies
              </span>
              <span className="text-xs text-teal-200 font-bold">Fast Local Fulfilment</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              Genuine Medicines &amp; Health Essentials, Verified by Pharmacists.
            </h1>

            <p className="text-xs sm:text-sm text-teal-100/90 max-w-lg leading-relaxed">
              Order over-the-counter wellness products or upload your doctor’s prescription for compliant review and door-step delivery from local licensed pharmacies in Indore.
            </p>
          </div>

          {/* Quick Stats / Pills */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-teal-700/60 mt-6 relative z-10">
            <div>
              <p className="text-base sm:text-lg font-black text-amber-400">100%</p>
              <p className="text-[11px] text-teal-200 font-medium">Batch Verified</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-amber-400">Form 20/21</p>
              <p className="text-[11px] text-teal-200 font-medium">FDA Licensed Chemist</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-black text-amber-400">Regulated</p>
              <p className="text-[11px] text-teal-200 font-medium">Doorstep Fulfilment</p>
            </div>
          </div>
        </div>

        {/* Right: PROMINENT UPLOAD PRESCRIPTION ACTION CARD */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-2xl tracking-wider">
            Fastest Order Path
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Order with Prescription
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Have a doctor’s note? Upload a photo or PDF. Our registered pharmacist will inspect the dosage, verify stock, and prepare your quotation.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Camera photo, gallery image or PDF accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reviewed by MP Pharmacy Council Registered Pharmacist</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stored securely in encrypted non-public storage</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={onOpenPrescriptionUpload}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-950 active:scale-98 text-white font-black text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Upload Prescription Now</span>
            </button>

            <button
              onClick={onOpenMyPrescriptions}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>View Previously Uploaded Prescriptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter Strip */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines by name, brand, or generic salt (e.g. Paracetamol, Augmentin, Dolo, Pantocid)..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-2xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              selectedFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Health &amp; Meds
          </button>
          <button
            onClick={() => setSelectedFilter('PRESCRIPTION')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'PRESCRIPTION'
                ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-amber-700" />
            <span>Prescription Drugs (Schedule H)</span>
          </button>
          <button
            onClick={() => setSelectedFilter('OTC')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'OTC'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
            <span>OTC Essentials</span>
          </button>
          <button
            onClick={() => setSelectedFilter('DEVICES')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'DEVICES'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-blue-600" />
            <span>Medical Devices &amp; Monitors</span>
          </button>
          <button
            onClick={() => setSelectedFilter('FIRST_AID')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'FIRST_AID'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bandage className="w-3.5 h-3.5 text-rose-600" />
            <span>First Aid &amp; Pain Relief</span>
          </button>
        </div>
      </div>

      {/* 4. Nearby Licensed Pharmacies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900">Nearby Licensed Pharmacies in Indore</h2>
            <p className="text-xs text-slate-500">
              Verified by MP State Drug Licensing Authority with Registered Pharmacists on premise.
            </p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {pharmacies.length} Licensed Stores Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-xs border border-forest-200">
                      Rx
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-tight">
                        {pharmacy.name}
                      </h3>
                      <p className="text-[10px] text-slate-500">{pharmacy.legalBusinessName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    FDA Licensed
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{pharmacy.addressLine}, {pharmacy.city}</span>
                  <span className="font-bold text-forest-700 ml-auto shrink-0">
                    {pharmacy.distanceKm.toFixed(1)} km
                  </span>
                </div>

                {pharmacy.activePharmacist && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                    <span className="font-bold text-slate-700">Chemist:</span> {pharmacy.activePharmacist.name} ({pharmacy.activePharmacist.registrationNumber})
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {pharmacy.operatingHours}
                </span>

                <button
                  onClick={onOpenPrescriptionUpload}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1"
                >
                  <span>Select Chemist</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Medicine & Healthcare Catalogue Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900">Medicine &amp; Healthcare Catalogue</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredMedicines.length} verified items available in Indore.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-xs transition flex flex-col justify-between overflow-hidden"
            >
              {/* Media area with category vector fallback */}
              <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                <div className="absolute top-2 left-2 z-10">
                  {med.requiresPrescription ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                      Rx Required
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      OTC
                    </span>
                  )}
                </div>

                <ImageWithFallback
                  src={med.imageUrl}
                  alt={med.name}
                  category="medicines"
                  aspectRatio="square"
                  objectFit="contain"
                  className="p-3"
                />

                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {med.dosageForm}
                </div>
              </div>

              {/* Medicine details */}
              <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-teal-800 truncate">{med.brand}</p>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 h-9 leading-snug">
                    {med.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">Pack: {med.packSize}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formatPaise(med.sellingPricePaise)}
                    </span>
                    {med.mrpPaise > med.sellingPricePaise && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPaise(med.mrpPaise)}
                      </span>
                    )}
                  </div>

                  {med.requiresPrescription ? (
                    <button
                      onClick={onOpenPrescriptionUpload}
                      className="w-full py-2 px-2 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 font-black text-xs rounded-xl border border-amber-300 transition flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-amber-700" />
                      <span>Upload Rx</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Added ${med.name} to health cart.`)}
                      className="w-full py-2 px-2 bg-slate-900 hover:bg-slate-950 active:scale-95 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainContentContainer>
  );
};
