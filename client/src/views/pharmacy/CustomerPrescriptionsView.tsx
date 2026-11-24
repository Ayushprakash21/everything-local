import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  Upload,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Truck,
  Building2,
  Pill,
  X
} from 'lucide-react';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  status: string;
  deliveryType: string;
  deliveryAddress?: string;
  pharmacistNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    pageNumber: number;
  }>;
  pharmacy?: {
    id: string;
    name: string;
    phone: string;
  };
  quotations?: Array<{
    id: string;
    quotationNumber: string;
    status: string;
    subtotalPaise: number;
    taxPaise: number;
    deliveryFeePaise: number;
    totalPaise: number;
    estimatedDeliveryMinutes: number;
    pharmacistNotes?: string;
    items: Array<{
      id: string;
      medicineName: string;
      dosageStrength: string;
      prescribedQuantity: number;
      approvedQuantity: number;
      unitPricePaise: number;
      totalPricePaise: number;
      isAvailable: boolean;
      substitutionNote?: string;
    }>;
  }>;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmountPaise: number;
    dispensedByPharmacist?: string;
    dispensedAt?: string;
  };
}

interface CustomerPrescriptionsViewProps {
  onBack: () => void;
  onOpenUpload: () => void;
  openAuth: () => void;
}

export const CustomerPrescriptionsView: React.FC<CustomerPrescriptionsViewProps> = ({
  onBack,
  onOpenUpload,
  openAuth
}) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchMyPrescriptions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await request<{ prescriptions: Prescription[] }>('/pharmacy/prescriptions/my');
      setPrescriptions(res.prescriptions || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPrescriptions();
  }, [user]);

  const handleConfirmQuotation = async (quotationId: string) => {
    setConfirming(true);
    try {
      await request(`/pharmacy/quotations/${quotationId}/confirm`, {
        method: 'POST'
      });
      setSelectedQuotation(null);
      setActionMsg('Order confirmed! The pharmacy is preparing and dispensing your medicines.');
      await fetchMyPrescriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm quotation');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this prescription request?')) return;
    try {
      await request(`/pharmacy/prescriptions/${prescriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      });
      await fetchMyPrescriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel prescription');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UPLOADED':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Awaiting Review</span>
          </span>
        );
      case 'UNDER_PHARMACIST_REVIEW':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            <span>Under Review</span>
          </span>
        );
      case 'AWAITING_CUSTOMER_CONFIRMATION':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Quotation Ready</span>
          </span>
        );
      case 'ORDER_CREATED':
      case 'DISPENSED':
      case 'COMPLETED':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-forest-50 text-forest-800 px-2.5 py-0.5 rounded-full border border-forest-200 flex items-center gap-1">
            <Truck className="w-3 h-3 text-forest-700" />
            <span>{status === 'DISPENSED' ? 'Dispensed' : 'Order Placed'}</span>
          </span>
        );
      case 'ADDITIONAL_INFO_REQUIRED':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>Info Needed</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Sign in to track prescriptions</h2>
        <p className="text-xs text-slate-500">
          Please sign in to access your doctor prescriptions, pharmacist review quotations, and dispensing status.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Prescriptions & Quotations
            </h1>
            <p className="text-xs text-slate-500">
              Track verification status and review pharmacist quotations for compliant medicine dispensing.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>Upload New Prescription</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-900 text-lg">No Prescriptions Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven’t submitted any medical prescriptions. Upload a photo or PDF to have it verified by a licensed pharmacist.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            Upload First Prescription
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const latestQuotation = rx.quotations && rx.quotations.length > 0 ? rx.quotations[0] : null;

            return (
              <div
                key={rx.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 space-y-4 hover:shadow-card transition"
              >
                {/* Top Row: Rx Number, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-900 tracking-wide">
                      {rx.prescriptionNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(rx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(rx.status)}</div>
                </div>

                {/* Patient and Pharmacy Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Patient</span>
                    <span className="font-bold text-slate-800">
                      {rx.patientName} ({rx.patientAge}y, {rx.patientGender})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Assigned Pharmacy</span>
                    <span className="font-bold text-slate-800">
                      {rx.pharmacy?.name || 'Nearest Licensed Chemist'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Pages Attached</span>
                    <span className="font-bold text-teal-800">
                      {rx.documents.length} document page(s)
                    </span>
                  </div>
                </div>

                {/* Pharmacist Notes / Rejection Reason */}
                {rx.pharmacistNotes && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
                    <span className="font-black text-teal-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Pharmacist Verification Note:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed">{rx.pharmacistNotes}</p>
                  </div>
                )}

                {rx.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
                    <span className="font-black text-rose-900 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>Reason for Rejection:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed">{rx.rejectionReason}</p>
                  </div>
                )}

                {/* Action Card: Quotation Ready to Confirm */}
                {rx.status === 'AWAITING_CUSTOMER_CONFIRMATION' && latestQuotation && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Action Required
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Pharmacist Quotation: {formatPaise(latestQuotation.totalPaise)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {latestQuotation.items.filter((i) => i.isAvailable).length} item(s) approved for dispensing. Delivery estimated in {latestQuotation.estimatedDeliveryMinutes} mins.
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedQuotation(latestQuotation)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <span>Review & Confirm Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Dispensed / Order Confirmed Info */}
                {rx.order && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Pharmacy Order: {rx.order.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {rx.order.dispensedByPharmacist
                          ? `Dispensed by: ${rx.order.dispensedByPharmacist}`
                          : 'Order confirmed with pharmacy.'}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      {formatPaise(rx.order.totalAmountPaise)}
                    </span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  {['SUBMITTED', 'UNDER_PHARMACIST_REVIEW', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(rx.status) ? (
                    <button
                      onClick={() => handleCancelPrescription(rx.id)}
                      className="text-slate-400 hover:text-rose-600 text-[11px] font-bold"
                    >
                      Cancel Request
                    </button>
                  ) : <div />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quotation Review & Order Confirmation Drawer */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Pharmacist Quotation</h3>
                <p className="text-xs text-slate-500">{selectedQuotation.quotationNumber}</p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approved Items Table */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Prescription Items Review
              </span>

              <div className="space-y-2">
                {selectedQuotation.items.map((item: any) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                      item.isAvailable ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/50 border-rose-200 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.medicineName}</p>
                      <p className="text-[11px] text-slate-500">
                        Strength: {item.dosageStrength || 'Standard'} • Prescribed: {item.prescribedQuantity}
                      </p>
                      {item.isAvailable ? (
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          ✓ {item.approvedQuantity} approved @ {formatPaise(item.unitPricePaise)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-700 font-bold mt-0.5">
                          ✗ Currently Out of Stock: {item.substitutionNote || 'Cannot dispense'}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900">
                        {formatPaise(item.totalPricePaise)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Approved Medicines)</span>
                <span>{formatPaise(selectedQuotation.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5% applicable)</span>
                <span>{formatPaise(selectedQuotation.taxPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span>{formatPaise(selectedQuotation.deliveryFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                <span>Total Amount Payable</span>
                <span className="text-forest-900">{formatPaise(selectedQuotation.totalPaise)}</span>
              </div>
            </div>

            {/* Statutory Notice */}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Payment method: <strong>Cash / UPI on Delivery</strong>. By confirming this order, you agree to receive the approved quantities under the supervision of the registered pharmacist.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQuotation(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleConfirmQuotation(selectedQuotation.id)}
                disabled={confirming}
                className="flex-1 py-3 px-4 bg-forest-900 hover:bg-forest-950 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Confirm Order (Pay on Delivery)</span>
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
