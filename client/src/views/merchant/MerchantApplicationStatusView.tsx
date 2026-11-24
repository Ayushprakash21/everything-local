import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Building2,
  Store,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface MerchantApplicationStatusViewProps {
  referenceNumber: string;
  onContinueApplication?: () => void;
  onGoToDashboard?: () => void;
}

export const MerchantApplicationStatusView: React.FC<MerchantApplicationStatusViewProps> = ({
  referenceNumber,
  onContinueApplication,
  onGoToDashboard
}) => {
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, [referenceNumber]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request<any>(`/onboarding/application/${referenceNumber}`);
      setApplication(res.application);
    } catch (e: any) {
      setError(e.message || 'Failed to load application status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500">Checking application status...</span>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-black text-slate-900 mb-1">Application Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'Please check your application reference number.'}</p>
        <button
          onClick={loadStatus}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
        >
          Retry Search
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: CheckCircle2,
          title: 'Application Approved & Verified',
          desc: 'Congratulations! Your merchant partner account is active.'
        };
      case 'DOCUMENTS_REQUIRED':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: AlertCircle,
          title: 'Action Required: Additional Documents Requested',
          desc: 'Our operations team requires clarification or re-upload of documents.'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: ShieldAlert,
          title: 'Application Not Approved',
          desc: 'Your application was rejected based on partner eligibility guidelines.'
        };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
          icon: Clock,
          title: 'Application Under Review',
          desc: 'Our Indore operations team is currently verifying your documents.'
        };
    }
  };

  const badge = getStatusBadge(application.status);
  const StatusIcon = badge.icon;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Application Status</span>
            <span className="text-base font-black font-mono text-slate-800">{application.referenceNumber}</span>
          </div>
          <button
            onClick={loadStatus}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`mt-6 p-4 rounded-xl border ${badge.bg} flex items-start gap-3.5`}>
          <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black tracking-tight">{badge.title}</h3>
            <p className="text-xs mt-0.5 opacity-90">{badge.desc}</p>
          </div>
        </div>

        {/* Admin Feedback (If Any) */}
        {application.adminFeedback && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-300 text-amber-900 text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Feedback from Indore Operations Desk:</span>
            </div>
            <p className="pl-5 leading-relaxed">{application.adminFeedback}</p>
          </div>
        )}

        {application.rejectionReason && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50/70 border border-rose-300 text-rose-900 text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              <span>Statutory Rejection Reason:</span>
            </div>
            <p className="pl-5 leading-relaxed">{application.rejectionReason}</p>
          </div>
        )}

        {/* Store & Business Summary */}
        <div className="mt-6 border border-slate-100 rounded-xl p-4 bg-slate-50/60 text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 font-bold">Store Display Name:</span>
            <span className="font-black text-slate-800">{application.storeName || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 font-bold">Category:</span>
            <span className="font-black text-slate-800">{application.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 font-bold">Platform Commission:</span>
            <span className="font-black text-emerald-700">{application.commissionRatePct}%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-bold">Submitted At:</span>
            <span className="font-semibold text-slate-700">
              {new Date(application.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          {application.status === 'APPROVED' && onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="w-full py-3 bg-emerald-600 text-white font-black text-sm rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              Launch Merchant Dashboard ➔
            </button>
          )}

          {(application.status === 'DRAFT' || application.status === 'DOCUMENTS_REQUIRED') && onContinueApplication && (
            <button
              onClick={onContinueApplication}
              className="w-full py-3 bg-emerald-600 text-white font-black text-sm rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              {application.status === 'DOCUMENTS_REQUIRED' ? 'Upload Requested Documents ➔' : 'Resume Application ➔'}
            </button>
          )}

          {application.status === 'SUBMITTED' && (
            <p className="text-center w-full text-xs text-slate-400">
              Our operations team reviews submissions within 24 hours. You will receive an SMS alert upon approval.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
