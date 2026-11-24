import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../api/client';
import {
  Upload,
  Camera,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  User as UserIcon,
  HelpCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface UploadedDocument {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath: string;
  previewUrl?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  addressLine: string;
  distanceKm: number;
}

interface PharmacyPrescriptionUploadViewProps {
  onBack: () => void;
  onSuccess: (prescriptionId: string) => void;
  openAuth: () => void;
}

export const PharmacyPrescriptionUploadView: React.FC<PharmacyPrescriptionUploadViewProps> = ({
  onBack,
  onSuccess,
  openAuth
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [createdRxId, setCreatedRxId] = useState<string | null>(null);

  // Patient Details
  const [patientName, setPatientName] = useState<string>(user?.name || '');
  const [patientAge, setPatientAge] = useState<string>('30');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [patientRelation, setPatientRelation] = useState<string>('Self');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Delivery Details
  const [deliveryType, setDeliveryType] = useState<'HOME_DELIVERY' | 'COUNTER_PICKUP'>('HOME_DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'Flat 302, Silver Springs, Old Palasia, Indore - 452001'
  );

  // Regulatory Compliance Check
  const [hasConfirmedRMP, setHasConfirmedRMP] = useState<boolean>(false);

  useEffect(() => {
    // Load nearby pharmacies for selection
    const loadPharmacies = async () => {
      try {
        const res = await request<{ pharmacies: Pharmacy[] }>('/pharmacy/stores?lat=22.7244&lng=75.8839');
        setPharmacies(res.pharmacies || []);
        if (res.pharmacies && res.pharmacies.length > 0) {
          setSelectedPharmacyId(res.pharmacies[0].id);
        }
      } catch (err) {
        console.error('Failed to load pharmacies:', err);
      }
    };
    loadPharmacies();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      openAuth();
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }

    try {
      const token = localStorage.getItem('el_token');
      const response = await fetch('/api/pharmacy/prescriptions/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Prescription upload failed');
      }

      // Generate object preview URLs for local presentation
      const newDocs: UploadedDocument[] = data.documents.map((doc: any, index: number) => ({
        ...doc,
        previewUrl: files[index] ? URL.createObjectURL(files[index]) : undefined
      }));

      setDocuments((prev) => [...prev, ...newDocs]);
    } catch (err: any) {
      setError(err.message || 'File upload failed. Please verify the document format.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuth();
      return;
    }

    if (documents.length === 0) {
      setError('Please upload at least one page of your prescription.');
      return;
    }

    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }

    if (!hasConfirmedRMP) {
      setError('Please confirm the medical practitioner declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await request<{ message: string; prescription: any }>('/pharmacy/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          pharmacyId: selectedPharmacyId || undefined,
          patientName: patientName.trim(),
          patientAge: parseInt(patientAge, 10) || 30,
          patientGender,
          patientRelation,
          customerNotes: customerNotes.trim() || undefined,
          deliveryAddress: deliveryAddress.trim(),
          deliveryType,
          documents: documents.map((d) => ({
            fileName: d.fileName,
            fileType: d.fileType,
            fileSizeBytes: d.fileSizeBytes,
            storagePath: d.storagePath
          }))
        })
      });

      setCreatedRxId(res.prescription.id);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Upload Doctor's Prescription
          </h1>
          <p className="text-xs text-slate-500">
            Secure, end-to-end verified dispensing under Madhya Pradesh State Pharmacy Council guidelines.
          </p>
        </div>
      </div>

      {/* Main Upload & Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Document Upload Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Prescription Document(s) *
              </label>
              <span className="text-[11px] font-bold text-slate-400">JPG, PNG, PDF up to 10MB</span>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileUpload}
              capture="environment"
              accept="image/*"
              className="hidden"
            />

            {/* Action Dropzone Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="p-5 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 rounded-2xl transition flex flex-col items-center justify-center gap-2 text-teal-800 font-bold text-xs"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                  <Camera className="w-5 h-5" />
                </div>
                <span>Take Photo with Camera</span>
                <span className="text-[10px] text-teal-600 font-normal">Direct phone camera capture</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-2xl transition flex flex-col items-center justify-center gap-2 text-amber-900 font-bold text-xs"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Upload from Gallery / PDF</span>
                <span className="text-[10px] text-amber-700 font-normal">Choose images or multi-page PDF</span>
              </button>
            </div>

            {uploading && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                <span>Uploading and inspecting prescription file content...</span>
              </div>
            )}

            {/* Document Preview Cards */}
            {documents.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Uploaded Pages ({documents.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {doc.previewUrl && doc.fileType.startsWith('image/') ? (
                            <img
                              src={doc.previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-teal-700" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400">
                            Page {idx + 1} • {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove page"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Patient Information */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              2. Patient Information *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Patient Full Name (as on Rx) *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Verma"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Relationship to Account Holder
                </label>
                <select
                  value={patientRelation}
                  onChange={(e) => setPatientRelation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                >
                  <option value="Self">Self</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Other">Other Relative</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Patient Age (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Patient Gender *
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Pharmacy & Fulfilment */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              3. Pharmacy Selection & Fulfilment Preference
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Select Licensed Pharmacy in Indore
              </label>
              <select
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              >
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.addressLine}) • {p.distanceKm.toFixed(1)} km
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeliveryType('HOME_DELIVERY')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  deliveryType === 'HOME_DELIVERY'
                    ? 'border-forest-900 bg-forest-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Express Home Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('COUNTER_PICKUP')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  deliveryType === 'COUNTER_PICKUP'
                    ? 'border-forest-900 bg-forest-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Counter Pickup</span>
              </button>
            </div>

            {deliveryType === 'HOME_DELIVERY' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Delivery Address in Indore *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, Landmark, Locality, Pincode"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Optional Notes for Pharmacist
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Need 1 month course. Please do not substitute any brand without calling me."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* 4. Statutory Regulatory Declaration */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={hasConfirmedRMP}
                onChange={(e) => setHasConfirmedRMP(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-forest-900 focus:ring-amber-500 shrink-0"
              />
              <span className="text-[11px] text-amber-950 font-medium leading-relaxed">
                <strong>Statutory Declaration:</strong> I confirm that this prescription is issued by a Registered Medical Practitioner (RMP) for the named patient. I understand that a licensed pharmacist will review validity, inventory, and dosages before dispensing, and that Schedule X drugs are prohibited from online sale.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || documents.length === 0}
            className="w-full py-4 px-6 bg-forest-900 hover:bg-forest-950 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-forest-900/20 transition flex items-center justify-center gap-2 border border-forest-800 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Transmitting Prescription to Licensed Pharmacist...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Submit Prescription for Pharmacist Review</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Prescription Successfully Submitted
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your prescription has been submitted. A licensed pharmacist at the selected pharmacy will review it before any eligible medicine is dispensed.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1">
              <p className="text-slate-500">
                <strong>Patient:</strong> {patientName} ({patientAge}y, {patientGender})
              </p>
              <p className="text-slate-500">
                <strong>Status:</strong> Under Pharmacist Review
              </p>
              <p className="text-slate-500">
                <strong>Estimated Review:</strong> Within 15 minutes
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (createdRxId) onSuccess(createdRxId);
              }}
              className="w-full py-3.5 px-6 bg-forest-900 hover:bg-forest-950 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              Track Prescription Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
