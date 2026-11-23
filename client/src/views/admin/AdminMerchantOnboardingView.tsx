import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import {
  Shield,
  Store,
  Building2,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  Percent,
  MapPin,
  Phone,
  Mail,
  User,
  MessageSquare,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const AdminMerchantOnboardingView: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({
    all: 0,
    submitted: 0,
    underReview: 0,
    documentsRequired: 0,
    approved: 0,
    rejected: 0
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'SUSPEND' | 'REACTIVATE';
    reason: string;
    commissionRatePct: number;
  }>({
    isOpen: false,
    type: 'APPROVE',
    reason: '',
    commissionRatePct: 3.5
  });

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await request<any>(`/admin/onboarding/applications?status=${selectedStatus}${q}`);
      setApplications(res.applications);
      setCounts(res.counts);
      if (selectedApp) {
        // Refresh selected app
        const updated = res.applications.find((a: any) => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load merchant applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = async (appId: string) => {
    try {
      const res = await request<any>(`/admin/onboarding/applications/${appId}`);
      setSelectedApp(res.application);
      setActionModal((prev) => ({
        ...prev,
        commissionRatePct: res.application.commissionRatePct || 3.5
      }));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch application details');
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setError(null);
    try {
      const payload: any = {
        action: actionModal.type
      };

      if (actionModal.type === 'APPROVE') {
        payload.commissionRatePct = actionModal.commissionRatePct;
      } else if (actionModal.type === 'REJECT') {
        if (!actionModal.reason.trim()) {
          setError('Rejection reason is mandatory.');
          setActionLoading(false);
          return;
        }
        payload.reason = actionModal.reason.trim();
      } else if (actionModal.type === 'REQUEST_DOCUMENTS') {
        if (!actionModal.reason.trim()) {
          setError('Feedback detailing requested documents is mandatory.');
          setActionLoading(false);
          return;
        }
        payload.feedback = actionModal.reason.trim();
      }

      const res = await request<any>(`/admin/onboarding/applications/${selectedApp.id}/action`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMsg(res.message || 'Action executed successfully');
      setSelectedApp(res.application);
      setActionModal({ isOpen: false, type: 'APPROVE', reason: '', commissionRatePct: 3.5 });
      await loadApplications();
    } catch (e: any) {
      setError(e.message || 'Failed to process admin action');
    } finally {
      setActionLoading(false);
    }
  };

  const TABS = [
    { id: 'SUBMITTED', label: 'Pending Review', count: counts.submitted },
    { id: 'DOCUMENTS_REQUIRED', label: 'Docs Required', count: counts.documentsRequired },
    { id: 'APPROVED', label: 'Approved & Active', count: counts.approved },
    { id: 'REJECTED', label: 'Rejected', count: counts.rejected },
    { id: 'ALL', label: 'All Applications', count: counts.all }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <span>Merchant Partner Onboarding Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review self-service store registrations, statutory KYC documents, and approve Indore merchant accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
              placeholder="Search ref, store or phone..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            onClick={loadApplications}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              selectedStatus === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                selectedStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error / Success Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Main Grid: Application List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue List */}
        <div className="lg:col-span-5 space-y-3">
          {loading && (
            <div className="p-8 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
              Loading merchant applications...
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No merchant applications in "{selectedStatus}" status.
            </div>
          )}

          {!loading &&
            applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      {app.referenceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : app.status === 'DOCUMENTS_REQUIRED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {app.storeName || app.businessName || 'Unnamed Store'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.ownerName} • +91 {app.ownerPhone}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                    <span>{app.category}</span>
                    <span>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Right: Selected Application Details */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-black text-slate-900">
                      {selectedApp.storeName || selectedApp.businessName}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      ({selectedApp.referenceNumber})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{selectedApp.category}</span>
                    <span>•</span>
                    <span>{selectedApp.city}, {selectedApp.state}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.status !== 'APPROVED' && (
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'APPROVE',
                          reason: '',
                          commissionRatePct: selectedApp.commissionRatePct || 3.5
                        })
                      }
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Store</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: 'REQUEST_DOCUMENTS',
                        reason: '',
                        commissionRatePct: selectedApp.commissionRatePct || 3.5
                      })
                    }
                    className="px-3 py-2 border border-amber-300 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition"
                  >
                    Request Docs
                  </button>

                  {selectedApp.status !== 'REJECTED' && (
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'REJECT',
                          reason: '',
                          commissionRatePct: selectedApp.commissionRatePct || 3.5
                        })
                      }
                      className="px-3 py-2 border border-rose-300 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Business & Legal Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Owner & Legal Entity
                  </span>
                  <p className="font-bold text-slate-900">{selectedApp.ownerName}</p>
                  <p className="text-slate-600">{selectedApp.ownerEmail} • +91 {selectedApp.ownerPhone}</p>
                  <p className="text-slate-600">Legal: {selectedApp.legalName || '—'} ({selectedApp.entityType})</p>
                  <p className="font-mono text-slate-800">PAN: {selectedApp.panNumber || '—'}</p>
                  <p className="font-mono text-slate-800">GSTIN: {selectedApp.gstin || 'Not registered'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Store Operations & Fulfilment
                  </span>
                  <p className="font-bold text-slate-900">{selectedApp.addressLine}</p>
                  <p className="text-slate-600">Indore, PIN: {selectedApp.pincode}</p>
                  <p className="text-slate-600">Radius: {selectedApp.deliveryRadiusKm} km • MOV: ₹{(selectedApp.minOrderValuePaise || 29900) / 100}</p>
                  <p className="text-slate-600">Hours: {selectedApp.openingTime} - {selectedApp.closingTime} (Off: {selectedApp.weeklyClosingDay})</p>
                  <p className="font-bold text-emerald-700">Commission: {selectedApp.commissionRatePct}%</p>
                </div>
              </div>

              {/* Bank Account Verification */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Settlement Bank Account</span>
                </h4>
                {selectedApp.bankAccount ? (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{selectedApp.bankAccount.accountHolderName}</span>
                      <span className="text-slate-600">{selectedApp.bankAccount.bankName} • IFSC: {selectedApp.bankAccount.ifsc}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800 block">{selectedApp.bankAccount.accountNumberMasked}</span>
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {selectedApp.bankAccount.verificationStatus}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">No bank account entered yet.</div>
                )}
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Statutory KYC Documents ({selectedApp.documents?.length || 0})</span>
                </h4>
                <div className="space-y-2">
                  {selectedApp.documents?.length > 0 ? (
                    selectedApp.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-slate-800 block">{doc.documentType.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] text-slate-400">{doc.fileName} ({(doc.fileSizeBytes / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Doc</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-400 text-xs">No documents uploaded.</div>
                  )}
                </div>
              </div>

              {/* Application Audit History */}
              {selectedApp.history?.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Audit History</h4>
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs bg-slate-50/50">
                    {selectedApp.history.map((h: any) => (
                      <div key={h.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700">
                            {h.fromStatus} ➔ {h.toStatus}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{h.notes}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select an application from the queue to review business details, KYC documents, and approve partner access.
            </div>
          )}
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Confirm Action: {actionModal.type.replace(/_/g, ' ')}
            </h3>

            {actionModal.type === 'APPROVE' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Approving this application will elevate the applicant's account to <strong>MERCHANT</strong>, activate their storefront, and enable catalog publishing across Indore.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmed Platform Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={actionModal.commissionRatePct}
                    onChange={(e) =>
                      setActionModal((prev) => ({
                        ...prev,
                        commissionRatePct: parseFloat(e.target.value) || 3.5
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {(actionModal.type === 'REJECT' || actionModal.type === 'REQUEST_DOCUMENTS') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {actionModal.type === 'REJECT' ? 'Statutory Rejection Reason *' : 'Feedback / Required Documents *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionModal.reason}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder={
                    actionModal.type === 'REJECT'
                      ? 'e.g. Unserviceable address outside Indore municipal limits.'
                      : 'e.g. Please re-upload legible copy of GST Certificate and cancelled cheque.'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className={`px-5 py-2 text-white rounded-xl text-xs font-black shadow-sm transition ${
                  actionModal.type === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionModal.type === 'REQUEST_DOCUMENTS'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Executing...' : `Confirm ${actionModal.type.replace(/_/g, ' ')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
