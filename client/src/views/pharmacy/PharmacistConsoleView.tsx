import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Plus,
  Trash2,
  Truck,
  Check,
  X,
  User,
  MapPin,
  ExternalLink,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientRelation: string;
  customerNotes?: string;
  pharmacistNotes?: string;
  rejectionReason?: string;
  status: string;
  deliveryType: string;
  deliveryAddress: string;
  createdAt: string;
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    pageNumber: number;
  }>;
  reviews: Array<{
    id: string;
    pharmacistName: string;
    pharmacistRegNo: string;
    decision: string;
    notes?: string;
    reviewTimestamp: string;
  }>;
  quotations: Array<any>;
}

interface QuotationItemInput {
  medicineName: string;
  dosageStrength: string;
  prescribedQuantity: number;
  approvedQuantity: number;
  unitPricePaise: number;
  isAvailable: boolean;
  substitutionNote?: string;
}

export const PharmacistConsoleView: React.FC<{ openAuth: () => void; onBack?: () => void }> = ({
  openAuth,
  onBack
}) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  // Review Form State
  const [decision, setDecision] = useState<'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'INFO_REQUESTED'>('APPROVED');
  const [doctorVerified, setDoctorVerified] = useState<boolean>(true);
  const [validityVerified, setValidityVerified] = useState<boolean>(true);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [pharmacistName, setPharmacistName] = useState<string>(user?.name || 'Pooja Verma, B.Pharm');
  const [pharmacistRegNo, setPharmacistRegNo] = useState<string>('MPPC-48291');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Quotation Builder State
  const [showQuotationModal, setShowQuotationModal] = useState<boolean>(false);
  const [quoteItems, setQuoteItems] = useState<QuotationItemInput[]>([
    {
      medicineName: 'Augmentin 625 Duo Tablet',
      dosageStrength: '625mg',
      prescribedQuantity: 2,
      approvedQuantity: 2,
      unitPricePaise: 20100,
      isAvailable: true
    }
  ]);
  const [deliveryFeePaise, setDeliveryFeePaise] = useState<number>(3000);
  const [estimatedDeliveryMins, setEstimatedDeliveryMins] = useState<number>(25);
  const [pharmacistQuoteNotes, setPharmacistQuoteNotes] = useState<string>('Dispensed from batch B2409, 100% genuine.');
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);

  // Dispense Form State
  const [showDispenseModal, setShowDispenseModal] = useState<boolean>(false);
  const [dispenseBatch, setDispenseBatch] = useState<string>('AUG-B2409');
  const [dispenseExpiry, setDispenseExpiry] = useState<string>('12/2026');
  const [dispensing, setDispensing] = useState<boolean>(false);

  const fetchConsoleQueue = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await request<{ prescriptions: Prescription[]; pharmacy: any }>('/pharmacy/console/prescriptions');
      setPrescriptions(res.prescriptions || []);
      setPharmacy(res.pharmacy || null);
    } catch (err: any) {
      console.error('Failed to load pharmacy console:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsoleQueue();
  }, [user]);

  // Handle Review Action
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;

    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      alert('Statutory requirement: Please enter a reason for prescription rejection.');
      return;
    }

    setSubmittingReview(true);
    try {
      await request(`/pharmacy/console/prescriptions/${selectedRx.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          doctorVerified,
          validityVerified,
          notes: reviewNotes.trim() || undefined,
          rejectionReason: rejectionReason.trim() || undefined,
          pharmacistName,
          pharmacistRegNo
        })
      });

      alert(`Prescription marked as ${decision}`);
      await fetchConsoleQueue();

      // If approved, automatically prompt quotation builder
      if (decision === 'APPROVED' || decision === 'PARTIALLY_APPROVED') {
        setShowQuotationModal(true);
      } else {
        setSelectedRx(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Quotation Submission
  const handleQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;

    setSubmittingQuote(true);
    try {
      await request(`/pharmacy/console/prescriptions/${selectedRx.id}/quotation`, {
        method: 'POST',
        body: JSON.stringify({
          items: quoteItems,
          deliveryFeePaise,
          estimatedDeliveryMinutes: estimatedDeliveryMins,
          pharmacistNotes: pharmacistQuoteNotes.trim() || undefined
        })
      });

      alert('Quotation submitted and transmitted to customer for confirmation!');
      setShowQuotationModal(false);
      setSelectedRx(null);
      await fetchConsoleQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to issue quotation');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Add Item to Quotation
  const addQuotationItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      {
        medicineName: '',
        dosageStrength: '',
        prescribedQuantity: 1,
        approvedQuantity: 1,
        unitPricePaise: 10000,
        isAvailable: true
      }
    ]);
  };

  const removeQuotationItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuotationItem = (index: number, field: string, value: any) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  if (!user || (user.role !== 'MERCHANT' && user.role !== 'ADMIN')) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Registered Pharmacist Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Only authorized retail pharmacy partners and registered pharmacists holding a valid Madhya Pradesh State Pharmacy Council registration may access prescription review.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition"
        >
          Sign In with Pharmacist Credentials
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-card">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pharmacist Prescription Console
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Authorised Chemist
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {pharmacy?.name || 'Apollo Pharmacy Palasia'} • Pharmacist in charge: <strong>{pharmacistName}</strong> (Reg: {pharmacistRegNo})
            </p>
          </div>
        </div>

        <button
          onClick={fetchConsoleQueue}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({prescriptions.length})</span>
        </button>
      </div>

      {/* Main Review Section: Split Queue and Review Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Incoming Prescriptions ({prescriptions.length})
            </h2>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Live Queue
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              Loading queue...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-700">All Prescriptions Reviewed</p>
              <p>No pending prescription documents in queue.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {prescriptions.map((rx) => {
                const isSelected = selectedRx?.id === rx.id;
                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-forest-900 bg-forest-50/40 ring-1 ring-forest-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{rx.prescriptionNumber}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {rx.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      {rx.patientName} ({rx.patientAge}y, {rx.patientGender})
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{rx.documents.length} page(s)</span>
                      <span>
                        {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Review & Inspection Workspace */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {!selectedRx ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 text-base">Select a prescription from the queue</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Select an incoming prescription to inspect attached documents, verify medical practitioner credentials, and prepare quotation.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* Rx Header */}
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedRx.prescriptionNumber}</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{selectedRx.patientName}</strong> ({selectedRx.patientAge}y, {selectedRx.patientGender}) • Relation: {selectedRx.patientRelation}
                  </p>
                </div>
                <span className="text-xs font-black uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                  {selectedRx.status}
                </span>
              </div>

              {/* Secure Document Viewer Section */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Secure Prescription Documents ({selectedRx.documents.length} Page/s)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRx.documents.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-teal-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          Page {doc.pageNumber}: {doc.fileName}
                        </span>
                      </div>

                      <a
                        href={`/api/pharmacy/prescriptions/${selectedRx.id}/documents/${doc.id}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-teal-800 transition flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Notes & Delivery */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <p>
                  <strong>Customer Delivery Address:</strong> {selectedRx.deliveryAddress} ({selectedRx.deliveryType})
                </p>
                {selectedRx.customerNotes && (
                  <p className="text-slate-600">
                    <strong>Customer Note:</strong> {selectedRx.customerNotes}
                  </p>
                )}
              </div>

              {/* Review & Decision Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Pharmacist Verification & Compliance Review
                </span>

                {/* Verification Checkboxes */}
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doctorVerified}
                      onChange={(e) => setDoctorVerified(e.target.checked)}
                      className="rounded border-slate-300 text-forest-900 focus:ring-teal-500"
                    />
                    <span>Verified Registered Medical Practitioner (RMP) details & clinic stamp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={validityVerified}
                      onChange={(e) => setValidityVerified(e.target.checked)}
                      className="rounded border-slate-300 text-forest-900 focus:ring-teal-500"
                    />
                    <span>Prescription date is valid (within statutory 6 months)</span>
                  </label>
                </div>

                {/* Decision Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Approve Rx
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('PARTIALLY_APPROVED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      decision === 'PARTIALLY_APPROVED'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Partial Availability
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('INFO_REQUESTED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      decision === 'INFO_REQUESTED'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Request Info
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      decision === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Reject Rx
                  </button>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Pharmacist Clinical / Inventory Notes
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified Augmentin 625 Duo 10s strip. Dosage: 1 tab twice daily as prescribed."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                  />
                </div>

                {decision === 'REJECTED' && (
                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">
                      Statutory Rejection Reason *
                    </label>
                    <input
                      type="text"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Prescription expired (>6 months), missing doctor registration number, or Schedule X prohibited."
                      className="w-full px-4 py-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                    />
                  </div>
                )}

                {/* Pharmacist Stamp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Pharmacist Name</span>
                    <span className="font-bold text-slate-800">{pharmacistName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">MP State Reg No</span>
                    <span className="font-bold text-teal-800">{pharmacistRegNo}</span>
                  </div>
                </div>

                {/* Submit Review Action */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 px-6 bg-forest-900 hover:bg-forest-950 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Recording Review...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-amber-400" />
                        <span>Submit Review Decision</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQuotationModal(true)}
                    className="py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Prepare Quotation
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Quotation Builder Modal */}
      {showQuotationModal && selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Prepare Eligible Medicine Quotation</h3>
                <p className="text-xs text-slate-500">For Prescription: {selectedRx.prescriptionNumber} ({selectedRx.patientName})</p>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuotationSubmit} className="space-y-5">
              {/* Quotation Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Prescribed Medicine Items ({quoteItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={addQuotationItem}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {quoteItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Medicine Name
                          </label>
                          <input
                            type="text"
                            required
                            value={item.medicineName}
                            onChange={(e) => updateQuotationItem(idx, 'medicineName', e.target.value)}
                            placeholder="e.g. Augmentin 625 Duo"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Strength / Form
                          </label>
                          <input
                            type="text"
                            value={item.dosageStrength}
                            onChange={(e) => updateQuotationItem(idx, 'dosageStrength', e.target.value)}
                            placeholder="e.g. 625mg Tab"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Approved Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.approvedQuantity}
                            onChange={(e) =>
                              updateQuotationItem(idx, 'approvedQuantity', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2 pt-4 sm:pt-0">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.unitPricePaise / 100}
                              onChange={(e) =>
                                updateQuotationItem(idx, 'unitPricePaise', (parseFloat(e.target.value) || 0) * 100)
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                            />
                          </div>

                          {quoteItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuotationItem(idx)}
                              className="p-2 text-rose-500 hover:text-rose-700 mt-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Availability toggle */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={(e) => updateQuotationItem(idx, 'isAvailable', e.target.checked)}
                            className="rounded border-slate-300 text-teal-700"
                          />
                          <span className={item.isAvailable ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                            {item.isAvailable ? 'In Stock (Eligible for dispensing)' : 'Out of Stock (Marked unavailable)'}
                          </span>
                        </label>

                        {!item.isAvailable && (
                          <input
                            type="text"
                            placeholder="Substitution or stock note"
                            value={item.substitutionNote || ''}
                            onChange={(e) => updateQuotationItem(idx, 'substitutionNote', e.target.value)}
                            className="w-48 px-2 py-1 bg-white border border-rose-300 rounded-lg text-[11px]"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Fee & Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFeePaise / 100}
                    onChange={(e) => setDeliveryFeePaise((parseFloat(e.target.value) || 0) * 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Estimated Delivery Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={estimatedDeliveryMins}
                    onChange={(e) => setEstimatedDeliveryMins(parseInt(e.target.value, 10) || 25)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="flex-1 py-3 px-6 bg-forest-900 hover:bg-forest-950 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {submittingQuote ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Quotation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>Send Quotation to Customer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
