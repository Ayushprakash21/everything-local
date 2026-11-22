import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import {
  FileText,
  Upload,
  Search,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Phone,
  Plus,
  Eye,
  Cross,
  Sparkles,
  HeartPulse,
  Pill,
  Thermometer,
  Bandage,
  ChevronRight,
  ArrowRight
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [rxCount, setRxCount] = useState<number>(0);

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const [pharmRes, medRes] = await Promise.all([
        request<{ pharmacies: Pharmacy[] }>('/pharmacy/stores?lat=22.7244&lng=75.8839'),
        request<{ medicines: Medicine[] }>('/pharmacy/medicines')
      ]);

      setPharmacies(pharmRes.pharmacies || []);
      setMedicines(medRes.medicines || []);

      if (user) {
        try {
          const myRxRes = await request<{ prescriptions: any[] }>('/pharmacy/prescriptions/my');
          setRxCount(myRxRes.prescriptions?.length || 0);
        } catch (e) {
          // Ignore if user not logged in
        }
      }
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, [user]);

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
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
    user?.email?.includes('pharmacist');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Regulatory Compliance Banner */}
      <div className="bg-emerald-950 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full">
                Licensed Partner Network
              </span>
              <span className="text-xs font-bold text-emerald-300">Indore, Madhya Pradesh</span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5 font-medium">
              Dispensed strictly under registered pharmacist supervision in compliance with Drugs and Cosmetics Rules, 1945.
            </p>
          </div>
        </div>

        {isPharmacistUser && onOpenPharmacistConsole && (
          <button
            onClick={onOpenPharmacistConsole}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Open Pharmacist Review Console</span>
          </button>
        )}
      </div>

      {/* 2. Hero Section with Prominent Prescription Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Banner */}
        <div className="lg:col-span-7 bg-gradient-to-br from-teal-900 via-teal-800 to-forest-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-card">
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Indore 24x7 Express
              </span>
              <span className="text-xs text-teal-200 font-bold">15-30 Min Delivery</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Genuine Medicines & Health Essentials, Verified by Pharmacists.
            </h1>

            <p className="text-xs sm:text-sm text-teal-100/90 max-w-lg leading-relaxed">
              Order over-the-counter wellness products or upload your doctor’s prescription for compliant review and door-step delivery from local licensed pharmacies in Indore.
            </p>
          </div>

          {/* Quick Stats / Pills */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-teal-700/60 mt-6 relative z-10">
            <div>
              <p className="text-lg font-black text-amber-400">100%</p>
              <p className="text-[11px] text-teal-200 font-medium">Genuine Batch Verified</p>
            </div>
            <div>
              <p className="text-lg font-black text-amber-400">Form 20/21</p>
              <p className="text-[11px] text-teal-200 font-medium">FDA Licensed Chemist</p>
            </div>
            <div>
              <p className="text-lg font-black text-amber-400">24x7</p>
              <p className="text-[11px] text-teal-200 font-medium">Emergency Fulfilment</p>
            </div>
          </div>
        </div>

        {/* Right: PROMINENT UPLOAD PRESCRIPTION ACTION CARD */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl flex flex-col justify-between relative overflow-hidden">
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
              className="w-full py-3.5 px-6 bg-forest-900 hover:bg-forest-950 active:scale-98 text-white font-black text-xs rounded-2xl shadow-lg shadow-forest-900/20 transition flex items-center justify-center gap-2 border border-forest-800"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Upload Prescription Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {user ? (
              <button
                onClick={onOpenMyPrescriptions}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-between border border-slate-200"
              >
                <span>Track My Prescriptions</span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  {rxCount} Active
                </span>
              </button>
            ) : (
              <button
                onClick={openAuth}
                className="w-full text-center text-[11px] text-amber-600 hover:text-amber-700 font-bold hover:underline"
              >
                Sign in to track your past prescriptions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines by name, brand, or generic salt (e.g. Paracetamol, Augmentin, Dolo, Pantocid)..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              selectedFilter === 'ALL'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Health & Meds
          </button>
          <button
            onClick={() => setSelectedFilter('PRESCRIPTION')}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'PRESCRIPTION'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-amber-700" />
            <span>Prescription Drugs (Schedule H)</span>
          </button>
          <button
            onClick={() => setSelectedFilter('OTC')}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'OTC'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
            <span>OTC Essentials</span>
          </button>
          <button
            onClick={() => setSelectedFilter('DEVICES')}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'DEVICES'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-blue-600" />
            <span>Medical Devices & Monitors</span>
          </button>
          <button
            onClick={() => setSelectedFilter('FIRST_AID')}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'FIRST_AID'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bandage className="w-3.5 h-3.5 text-rose-600" />
            <span>First Aid & Pain Relief</span>
          </button>
        </div>
      </div>

      {/* 4. Nearby Licensed Pharmacies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Nearby Licensed Pharmacies in Indore</h2>
            <p className="text-xs text-slate-500">
              Verified by MP State Drug Licensing Authority with Registered Pharmacists on premise.
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {pharmacies.length} Licensed Stores Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle hover:border-teal-500/50 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">{pharmacy.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      FDA Approved
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {pharmacy.addressLine}, {pharmacy.city} ({pharmacy.distanceKm.toFixed(1)} km)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                  <Cross className="w-5 h-5 text-teal-600" />
                </div>
              </div>

              {/* Pharmacist & Licence Stamp */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                {pharmacy.activePharmacist && (
                  <p className="text-slate-700">
                    <span className="font-bold text-slate-900">Registered Pharmacist:</span>{' '}
                    {pharmacy.activePharmacist.name} ({pharmacy.activePharmacist.registrationNumber})
                  </p>
                )}
                {pharmacy.activeLicences && pharmacy.activeLicences.length > 0 && (
                  <p className="text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-700">Drug Licences:</span>{' '}
                    {pharmacy.activeLicences.map((l) => `${l.licenceType}: ${l.licenceNumber}`).join(' | ')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {pharmacy.operatingHours}
                </span>

                <button
                  onClick={onOpenPrescriptionUpload}
                  className="px-3.5 py-1.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1"
                >
                  <span>Select Pharmacy</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Medicine Catalogue Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Medicine & Healthcare Catalogue</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredMedicines.length} verified items available in Indore.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle flex flex-col justify-between space-y-3 hover:shadow-card transition"
            >
              <div className="space-y-2">
                {/* Badge based on schedule */}
                <div className="flex items-center justify-between">
                  {med.requiresPrescription ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Rx Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      OTC Product
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-400">{med.dosageForm}</span>
                </div>

                <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                  {med.name}
                </h3>

                <p className="text-[11px] text-teal-800 font-bold">
                  {med.brand} • <span className="text-slate-500 font-normal">{med.genericName}</span>
                </p>

                <p className="text-[11px] text-slate-400 font-medium">Pack: {med.packSize}</p>
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-black text-slate-900">
                    {formatPaise(med.sellingPricePaise)}
                  </span>
                  {med.mrpPaise > med.sellingPricePaise && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPaise(med.mrpPaise)}
                    </span>
                  )}
                </div>

                {med.requiresPrescription ? (
                  <button
                    onClick={onOpenPrescriptionUpload}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 font-black text-xs rounded-xl border border-amber-300 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Upload Rx to Order</span>
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`Item ${med.name} added to your health cart.`)}
                    className="w-full py-2 px-3 bg-forest-900 hover:bg-forest-950 active:scale-95 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
