import React, { useState, useEffect } from 'react';
import { request, formatPaise } from '../../../api/client';
import {
  Truck,
  Users,
  FileCheck,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Navigation,
  Shield,
  Eye,
  Check,
  X,
  Phone,
  UserCheck,
  Send,
  Zap,
  ChevronRight
} from 'lucide-react';

export const AdminDeliveryOperationsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'overview'
    | 'partners'
    | 'applications'
    | 'documents'
    | 'live'
    | 'assignments'
    | 'history'
    | 'settlements'
    | 'performance'
    | 'incidents'
    | 'config'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [liveTasks, setLiveTasks] = useState<any[]>([]);
  const [onlinePartners, setOnlinePartners] = useState<any[]>([]);
  const [historyTasks, setHistoryTasks] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [unsettledRiders, setUnsettledRiders] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Action States
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');
  const [manualAssignTask, setManualAssignTask] = useState<any | null>(null);
  const [selectedPartnerForAssign, setSelectedPartnerForAssign] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeSubTab === 'overview') {
        const res = await request<any>('/admin/delivery-operations/overview');
        setOverviewMetrics(res.metrics);
      } else if (activeSubTab === 'partners') {
        const res = await request<any>('/admin/delivery-operations/partners');
        setPartners(res.partners);
      } else if (activeSubTab === 'applications') {
        const res = await request<any>('/admin/delivery-operations/applications');
        setApplications(res.applications);
      } else if (activeSubTab === 'documents') {
        const res = await request<any>('/admin/delivery-operations/applications');
        setApplications(res.applications);
      } else if (activeSubTab === 'live') {
        const res = await request<any>('/admin/delivery-operations/live');
        setLiveTasks(res.activeTasks);
        setOnlinePartners(res.onlinePartners);
      } else if (activeSubTab === 'assignments') {
        const [liveRes, histRes] = await Promise.all([
          request<any>('/admin/delivery-operations/live'),
          request<any>('/admin/delivery-operations/history?status=AVAILABLE')
        ]);
        setOnlinePartners(liveRes.onlinePartners || []);
        setHistoryTasks(histRes.tasks || []);
      } else if (activeSubTab === 'history') {
        const res = await request<any>('/admin/delivery-operations/history');
        setHistoryTasks(res.tasks);
      } else if (activeSubTab === 'settlements') {
        const res = await request<any>('/admin/delivery-operations/settlements');
        setSettlements(res.settlements);
        setUnsettledRiders(res.unsettledRiders);
      } else if (activeSubTab === 'performance') {
        const res = await request<any>('/admin/delivery-operations/performance');
        setPerformanceMetrics(res.metrics);
      } else if (activeSubTab === 'incidents') {
        const res = await request<any>('/admin/delivery-operations/incidents');
        setIncidents(res.incidents);
      } else if (activeSubTab === 'config') {
        const res = await request<any>('/admin/delivery-operations/config');
        setPricingRules(res.rules);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 1. Partner Approval / Rejection
  const handlePartnerDecision = async (partnerId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await request(`/admin/delivery-operations/applications/${partnerId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      showNotification(`Partner application successfully ${decision.toLowerCase()}`);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // 2. Document Verification
  const handleVerifyDocument = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await request(`/admin/delivery-operations/documents/${docId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          rejectionReason: status === 'REJECTED' ? docRejectReason : undefined
        })
      });
      setSelectedDoc(null);
      setDocRejectReason('');
      showNotification(`Document marked as ${status}`);
      loadData();
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    }
  };

  // 3. Suspend / Reactivate Partner
  const handleTogglePartnerStatus = async (partnerId: string, approvalStatus: string) => {
    try {
      await request(`/admin/delivery-operations/partners/${partnerId}/status`, {
        method: 'POST',
        body: JSON.stringify({ approvalStatus })
      });
      showNotification(`Partner status updated to ${approvalStatus}`);
      loadData();
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    }
  };

  // 4. Manual Dispatch Assignment
  const handleManualAssign = async () => {
    if (!manualAssignTask || !selectedPartnerForAssign) return;
    try {
      await request('/admin/delivery-operations/assignments/manual-assign', {
        method: 'POST',
        body: JSON.stringify({
          taskId: manualAssignTask.id,
          partnerId: selectedPartnerForAssign
        })
      });
      setManualAssignTask(null);
      setSelectedPartnerForAssign('');
      showNotification('Task offered to courier with 2-minute reservation');
      loadData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // 5. Payout Settlement
  const handleProcessSettlement = async (riderId: string) => {
    try {
      await request('/admin/delivery-operations/settlements/payout', {
        method: 'POST',
        body: JSON.stringify({ riderId })
      });
      showNotification('Settlement processed successfully and marked as COMPLETED');
      loadData();
    } catch (err: any) {
      alert(`Payout failed: ${err.message}`);
    }
  };

  // 6. Resolve Incident
  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    try {
      await request(`/admin/delivery-operations/incidents/${selectedIncident.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionNotes: incidentNotes || 'Resolved by administrator',
          adminAction: 'RESOLVED'
        })
      });
      setSelectedIncident(null);
      setIncidentNotes('');
      showNotification('Incident marked as RESOLVED');
      loadData();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'partners', label: 'Partners Roster', icon: Users },
    { id: 'applications', label: 'Applications', icon: UserCheck },
    { id: 'documents', label: 'Document Desk', icon: FileCheck },
    { id: 'live', label: 'Live Operations', icon: Navigation },
    { id: 'assignments', label: 'Manual Dispatch', icon: Zap },
    { id: 'history', label: 'Trip History', icon: Clock },
    { id: 'settlements', label: 'Settlements', icon: DollarSign },
    { id: 'performance', label: 'SLA Performance', icon: CheckCircle2 },
    { id: 'incidents', label: 'Incidents & Support', icon: AlertTriangle },
    { id: 'config', label: 'Pricing Config', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Operations Control Tower</h1>
              <p className="text-sm text-gray-500">
                Hyperlocal dispatch, partner onboarding, statutory verification & settlement engine (Indore Central Hub)
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-sm">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Areas */}
      {loading && !overviewMetrics && (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600 font-medium">Syncing delivery operations data...</span>
        </div>
      )}

      {/* 1. OVERVIEW DASHBOARD */}
      {activeSubTab === 'overview' && overviewMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Partners</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overviewMetrics.totalPartners}</div>
              <p className="text-xs text-gray-500 mt-1">Registered couriers</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Online Now</span>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{overviewMetrics.onlinePartners}</div>
              <p className="text-xs text-emerald-700 mt-1">Ready for dispatch</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In-Transit</span>
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{overviewMetrics.activeTasks}</div>
              <p className="text-xs text-gray-500 mt-1">Assigned active trips</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Queue</span>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{overviewMetrics.unassignedTasks}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting acceptance</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Delivered Today</span>
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-indigo-600">{overviewMetrics.todayDelivered}</div>
              <p className="text-xs text-gray-500 mt-1">Completed handovers</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Open Incidents</span>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600">{overviewMetrics.openIncidents}</div>
              <p className="text-xs text-gray-500 mt-1">Action required</p>
            </div>
          </div>

          {/* Quick Shortcuts & Operational Rules */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="max-w-3xl">
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 text-xs font-semibold rounded-full uppercase tracking-wider">
                Indore Dispatch Grid Protocol
              </span>
              <h2 className="text-xl font-bold mt-2">Autonomous 45-Second Dispatch Window</h2>
              <p className="text-sm text-blue-100 mt-1 leading-relaxed">
                When merchants mark orders as ready, our proximity engine broadcasts task offers to optimal online couriers
                within a 4km service radius. Couriers hold a 45-second atomic reservation. If unaccepted, offers cascade
                automatically to the next candidate tier.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveSubTab('live')}
                  className="px-4 py-2 bg-white text-blue-900 font-semibold text-xs rounded-xl hover:bg-blue-50 transition"
                >
                  View Live Map & Fleet &rarr;
                </button>
                <button
                  onClick={() => setActiveSubTab('applications')}
                  className="px-4 py-2 bg-blue-800 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition"
                >
                  Review Onboarding Queue &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DELIVERY PARTNERS ROSTER */}
      {activeSubTab === 'partners' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-gray-900">Delivery Fleet Partners ({partners.length})</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by code, name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Partner Code</th>
                  <th className="px-6 py-3">Name & Contact</th>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Duty State</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners
                  .filter(
                    (p) =>
                      !searchQuery ||
                      p.riderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.user?.phone?.includes(searchQuery)
                  )
                  .map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50/80">
                      <td className="px-6 py-4 font-mono font-medium text-blue-600">{partner.riderCode}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{partner.user?.name}</div>
                        <div className="text-xs text-gray-400">{partner.user?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                          {partner.vehicleType}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">{partner.vehicleNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">★ {partner.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-xs text-gray-400 ml-1">({partner.totalDeliveries} trips)</span>
                      </td>
                      <td className="px-6 py-4">
                        {partner.isOnline ? (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
                            OFFLINE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            partner.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : partner.approvalStatus === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {partner.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {partner.approvalStatus === 'APPROVED' ? (
                          <button
                            onClick={() => handleTogglePartnerStatus(partner.id, 'SUSPENDED')}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePartnerStatus(partner.id, 'APPROVED')}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PARTNER APPLICATIONS QUEUE */}
      {activeSubTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Partner Onboarding Applications ({applications.length})</h3>
            <span className="text-xs text-gray-500">Requires verification of statutory driving documents</span>
          </div>

          <div className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No applications currently awaiting review.</div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-base">{app.user?.name}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-mono rounded">
                        {app.riderCode}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                        {app.approvalStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-4">
                      <span>Phone: {app.user?.phone}</span>
                      <span>Vehicle: {app.vehicleType} ({app.vehicleNumber})</span>
                      <span>Area: {app.serviceArea}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Emergency Contact: {app.emergencyContactName || 'N/A'} ({app.emergencyContactPhone || 'N/A'})
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePartnerDecision(app.id, 'APPROVED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => handlePartnerDecision(app.id, 'REJECTED')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. DOCUMENT DESK */}
      {activeSubTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Statutory Document Verification Desk</h3>
          <p className="text-sm text-gray-500 mb-6">
            Review driving licences, vehicle RC, and insurance documents uploaded by courier candidates.
            (Note: Aadhaar collection is legally excluded).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.flatMap((a) => a.documents || []).length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-400">No documents pending verification.</div>
            ) : (
              applications.flatMap((a) => a.documents || []).map((doc: any) => (
                <div key={doc.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-700">{doc.documentType}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        doc.verificationStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    <div>Doc Number: <span className="font-mono text-gray-800">{doc.documentNumber || 'N/A'}</span></div>
                    <div>Format: <span className="text-gray-800">{doc.mimeType}</span></div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Document &rarr;
                    </a>
                    {doc.verificationStatus === 'PENDING' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDocRejectReason('Document unreadable or invalid');
                          }}
                          className="px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. LIVE OPERATIONS */}
      {activeSubTab === 'live' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active In-Transit Deliveries */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Active Live Deliveries ({liveTasks.length})</h3>
                <span className="text-xs text-blue-600 font-semibold">Real-time Telemetry</span>
              </div>

              <div className="space-y-3">
                {liveTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No deliveries currently in transit.</p>
                ) : (
                  liveTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600">{task.taskNumber}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                          {task.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>Pickup: <span className="font-semibold text-gray-800">{task.pickupLocationName}</span></div>
                        <div>Drop: <span className="font-semibold text-gray-800">{task.deliveryAddress}</span></div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 text-gray-500">
                        <span>Courier: {task.rider?.user?.name || 'Unassigned'}</span>
                        <span>Est: {task.estimatedMinutes} mins</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Online Fleet Telemetry */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Online Fleet ({onlinePartners.length})</h3>
                <span className="text-xs text-emerald-600 font-semibold">Active Duty</span>
              </div>

              <div className="space-y-3">
                {onlinePartners.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No couriers currently online.</p>
                ) : (
                  onlinePartners.map((rider) => (
                    <div key={rider.id} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{rider.user?.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{rider.riderCode} • {rider.user?.phone}</div>
                        <div className="text-xs text-emerald-700 mt-1">
                          GPS: {rider.currentLatitude?.toFixed(4)}, {rider.currentLongitude?.toFixed(4)}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                        AVAILABLE
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MANUAL DISPATCH */}
      {activeSubTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Manual Dispatch & Task Override</h3>
              <p className="text-sm text-gray-500">
                Override automated dispatch by manually offering unassigned orders to an online courier.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {historyTasks.filter((t) => t.status === 'AVAILABLE').length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No unassigned orders currently awaiting couriers.</p>
            ) : (
              historyTasks
                .filter((t) => t.status === 'AVAILABLE')
                .map((task) => (
                  <div key={task.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-blue-600">{task.taskNumber}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                          AVAILABLE
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        From: {task.pickupLocationName} &rarr; To: {task.deliveryAddress}
                      </div>
                    </div>

                    <button
                      onClick={() => setManualAssignTask(task)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Assign Courier &rarr;
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 7. TRIP HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Delivery Trips & Digital Proofs ({historyTasks.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Task ID</th>
                  <th className="px-6 py-3">Pickup & Drop</th>
                  <th className="px-6 py-3">Courier</th>
                  <th className="px-6 py-3">Payout</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Proof Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{task.taskNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{task.pickupLocationName}</div>
                      <div className="text-xs text-gray-400">&rarr; {task.deliveryAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{task.rider?.user?.name || 'Unassigned'}</div>
                      <div className="text-xs text-gray-400">{task.rider?.riderCode}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatPaise(task.totalPayoutPaise)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'FAILED_DELIVERY'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {task.proofs && task.proofs.length > 0 ? (
                        <span className="text-emerald-600 font-medium">OTP Verified</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SETTLEMENTS */}
      {activeSubTab === 'settlements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Unsettled Delivery Earnings</h3>
            <p className="text-sm text-gray-500 mb-4">
              Consolidated courier earnings pending automated bank transfer or UPI payout.
            </p>

            <div className="divide-y divide-gray-100">
              {unsettledRiders.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">All partner earnings are settled.</p>
              ) : (
                unsettledRiders.map((unsettled) => (
                  <div key={unsettled.riderId} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold text-gray-900">Partner ID: {unsettled.riderId}</div>
                      <div className="text-xs text-gray-500">{unsettled._count.id} trips completed</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-base text-gray-900">
                        {formatPaise(unsettled._sum.amountPaise || 0)}
                      </span>
                      <button
                        onClick={() => handleProcessSettlement(unsettled.riderId)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Process Payout
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Recent Settlement Batches</h3>
            <div className="space-y-3">
              {settlements.map((s) => (
                <div key={s.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-blue-600">{s.payoutReference}</div>
                    <div className="text-xs text-gray-500">Processed for: {s.rider?.user?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700 text-sm">{formatPaise(s.netPayoutPaise)}</div>
                    <span className="text-xs text-emerald-600 font-semibold">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. SLA PERFORMANCE */}
      {activeSubTab === 'performance' && performanceMetrics && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Hyperlocal SLA Adherence Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-xs font-semibold text-blue-600 uppercase">On-Time Handover Rate</span>
              <div className="text-3xl font-extrabold text-blue-900 mt-2">{performanceMetrics.onTimeRatePct}%</div>
              <p className="text-xs text-blue-700 mt-1">Delivered within estimated ETA window</p>
            </div>

            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-600 uppercase">Avg Delivery Minutes</span>
              <div className="text-3xl font-extrabold text-indigo-900 mt-2">{performanceMetrics.avgDeliveryMinutes}m</div>
              <p className="text-xs text-indigo-700 mt-1">From partner pickup to customer OTP</p>
            </div>

            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Trips Analyzed</span>
              <div className="text-3xl font-extrabold text-emerald-900 mt-2">{performanceMetrics.totalAnalyzed}</div>
              <p className="text-xs text-emerald-700 mt-1">Rolling completed deliveries sample</p>
            </div>
          </div>
        </div>
      )}

      {/* 10. INCIDENTS & SUPPORT */}
      {activeSubTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Reported Courier & Logistics Incidents ({incidents.length})</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {incidents.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No open incidents or breakdown tickets.</p>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded">
                        {inc.incidentType}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium mt-1">{inc.description}</p>
                    <div className="text-xs text-gray-500">
                      Reported by: {inc.partner?.user?.name} ({inc.partner?.riderCode})
                    </div>
                  </div>

                  {inc.status === 'OPEN' && (
                    <button
                      onClick={() => setSelectedIncident(inc)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Resolve Ticket &rarr;
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 11. PRICING CONFIGURATION */}
      {activeSubTab === 'config' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Delivery Pricing Rules & Surcharges</h3>
          <p className="text-sm text-gray-500 mb-6">
            Configure base payouts, kilometer distance rates, and surge multipliers per delivery tier.
          </p>

          <div className="space-y-4">
            {pricingRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-sm text-blue-600">{rule.tierCode}</span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Target: {rule.targetMinutes} mins • Max Distance: {rule.maxRoadDistanceKm} km
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block">Base Pay</span>
                    <span className="font-semibold text-gray-900">{formatPaise(rule.baseDeliveryPaise)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Per Km</span>
                    <span className="font-semibold text-gray-900">{formatPaise(rule.perKmPaise)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Surge Mult</span>
                    <span className="font-semibold text-gray-900">{rule.peakMultiplier}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Reject Document */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Reject Document</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter statutory reason for rejecting {selectedDoc.documentType}:
            </p>
            <textarea
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDocument(selectedDoc.id, 'REJECTED')}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Assign Task */}
      {manualAssignTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Assign Task: {manualAssignTask.taskNumber}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select an online partner to receive this task offer:
            </p>
            <select
              value={selectedPartnerForAssign}
              onChange={(e) => setSelectedPartnerForAssign(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Courier --</option>
              {onlinePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user?.name} ({p.riderCode})
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setManualAssignTask(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                disabled={!selectedPartnerForAssign}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Incident */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Resolve Incident Ticket</h3>
            <p className="text-sm text-gray-500 mb-2">Incident: {selectedIncident.incidentType}</p>
            <textarea
              placeholder="Enter resolution notes..."
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveIncident}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
