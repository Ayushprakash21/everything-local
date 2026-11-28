import React, { useState, useEffect } from 'react';
import { request, formatPaise } from '../../api/client';
import {
  Building2,
  Package,
  Layers,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

export const AdminWholesaleView: React.FC = () => {
  const [section, setSection] = useState<
    'wholesalers' | 'products' | 'categories' | 'orders' | 'rfqs' | 'analytics'
  >('wholesalers');
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({ orders: [], rfqs: [], analytics: {} });
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [wRes, pRes, cRes, oRes] = await Promise.all([
        request<{ wholesalers: any[] }>('/wholesale/admin/wholesalers'),
        request<{ products: any[] }>('/wholesale/admin/products'),
        request<{ categories: any[] }>('/wholesale/admin/categories'),
        request<any>('/wholesale/admin/overview')
      ]);
      setWholesalers(wRes.wholesalers || []);
      setProducts(pRes.products || []);
      setCategories(cRes.categories || []);
      setOverview(oRes);
    } catch (err) {
      console.error('Failed to load admin wholesale data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleVerifyWholesaler = async (id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    const reason =
      status !== 'APPROVED' ? prompt(`Enter reason for ${status} status:`) || '' : 'Verified by Super Admin';
    try {
      await request(`/wholesale/admin/wholesalers/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status, reason })
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleModerateProduct = async (id: string, approvalStatus: 'APPROVED' | 'REJECTED' | 'MODERATED') => {
    const moderationReason =
      approvalStatus !== 'APPROVED' ? prompt(`Enter moderation reason for ${approvalStatus}:`) || '' : 'Approved for B2B catalog';
    try {
      await request(`/wholesale/admin/products/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ approvalStatus, moderationReason })
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await request('/wholesale/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });
      setNewCatName('');
      setNewCatDesc('');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivateCategory = async (id: string) => {
    if (!confirm('Deactivate this wholesale category?')) return;
    try {
      await request(`/wholesale/admin/categories/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Wholesale Marketplace Operations</h2>
          <p className="text-xs text-slate-500">
            Manage Wholesaler Applications, Verification, Products, Categories, Orders, RFQs & Analytics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'wholesalers', label: `Wholesalers & Verification (${wholesalers.length})` },
            { id: 'products', label: `Wholesale Products (${products.length})` },
            { id: 'categories', label: `Categories (${categories.length})` },
            { id: 'orders', label: `Orders (${overview.orders?.length || 0})` },
            { id: 'rfqs', label: `RFQs & Quotes (${overview.rfqs?.length || 0})` },
            { id: 'analytics', label: 'Settlements & Analytics' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black border transition ${
                section === t.id
                  ? 'bg-[#0B1F3B] text-white border-[#0B1F3B]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-500">Loading wholesale records...</div>
      ) : (
        <>
          {section === 'wholesalers' && (
            <div className="space-y-3">
              {wholesalers.map((w) => (
                <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{w.businessName}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800">
                        {w.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Legal: {w.legalBusinessName} • Type: {w.businessType} • {w.hasGst ? `GSTIN: ${w.gstin}` : 'Non-GST'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {w.businessAddress}, {w.city} ({w.pincode}) • Contact: {w.contactName} ({w.contactPhone})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.verificationStatus !== 'APPROVED' && (
                      <button
                        onClick={() => handleVerifyWholesaler(w.id, 'APPROVED')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                      >
                        Approve
                      </button>
                    )}
                    {w.verificationStatus !== 'REJECTED' && (
                      <button
                        onClick={() => handleVerifyWholesaler(w.id, 'REJECTED')}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black"
                      >
                        Reject
                      </button>
                    )}
                    {w.verificationStatus === 'APPROVED' && (
                      <button
                        onClick={() => handleVerifyWholesaler(w.id, 'SUSPENDED')}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'products' && (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{p.title}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black">{p.approvalStatus}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Supplier: {p.wholesaler?.businessName} • Category: {p.category?.name} • MOQ: {p.moq} {p.unitOfMeasurement} • Base: {formatPaise(p.basePricePaise)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleModerateProduct(p.id, 'APPROVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerateProduct(p.id, 'MODERATED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold"
                    >
                      Moderate
                    </button>
                    <button
                      onClick={() => handleModerateProduct(p.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{c.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {c._count?.products || 0} products • {c.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    {c.isActive && (
                      <button onClick={() => handleDeactivateCategory(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddCategory} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 h-fit">
                <h4 className="text-sm font-black text-slate-900">Create Wholesale Category</h4>
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <textarea
                  placeholder="Description"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0B1F3B] text-white text-xs font-black">
                  Add Category
                </button>
              </form>
            </div>
          )}

          {section === 'orders' && (
            <div className="space-y-3">
              {(overview.orders || []).map((o: any) => (
                <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-900">{o.orderNumber}</span>
                    <p className="text-slate-500">
                      Buyer: {o.buyer?.name} → Supplier: {o.wholesaler?.businessName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold">{o.status}</span>
                    <p className="font-black text-slate-900 mt-1">{formatPaise(o.totalPaise)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'rfqs' && (
            <div className="space-y-3">
              {(overview.rfqs || []).map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-900">{r.rfqNumber} • {r.status}</span>
                    <p className="text-slate-600">
                      {r.product?.title} ({r.requestedQty} units) • {r.buyer?.name} → {r.wholesaler?.businessName}
                    </p>
                  </div>
                  <span className="font-bold text-slate-700">{r.quotations?.length || 0} Quotes</span>
                </div>
              ))}
            </div>
          )}

          {section === 'analytics' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Total Wholesalers', val: overview.analytics?.totalWholesalers || 0 },
                { label: 'Wholesale Products', val: overview.analytics?.totalProducts || 0 },
                { label: 'Wholesale Orders', val: overview.analytics?.totalOrders || 0 },
                { label: 'Total RFQs', val: overview.analytics?.totalRfqs || 0 },
                { label: 'Wholesale GMV', val: formatPaise(overview.analytics?.totalGmvPaise || 0) }
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <span className="text-[11px] font-bold text-slate-500 block">{m.label}</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{m.val}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
