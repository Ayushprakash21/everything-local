import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { ELLogo } from '../../components/ELLogo';
import {
  Users,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Clock,
  DollarSign,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HouseholdMember {
  id: string;
  role: string;
  canSpend: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface HouseholdShoppingItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string | null;
  estimatedPricePaise: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recurringIntervalDays: number | null;
  lastPurchasedAt: string | null;
  isPurchased: boolean;
}

interface HouseholdData {
  id: string;
  name: string;
  ownerId: string;
  monthlyBudgetPaise: number;
  monthlySpendPaise: number;
  members: HouseholdMember[];
  shoppingItems: HouseholdShoppingItem[];
}

export const HouseholdView: React.FC<{ openAuth: () => void; onBack: () => void }> = ({
  openAuth,
  onBack
}) => {
  const { user } = useAuth();
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemInterval, setNewItemInterval] = useState(7);
  const [newItemPriority, setNewItemPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [error, setError] = useState<string | null>(null);

  const fetchHousehold = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await request<{ household: HouseholdData }>('/household/my');
      setHousehold(res.household);
    } catch (err: any) {
      console.warn('Household fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household || !newItemName.trim()) return;

    try {
      await request('/household/items', {
        method: 'POST',
        body: JSON.stringify({
          householdId: household.id,
          productName: newItemName.trim(),
          quantity: newItemQty,
          priority: newItemPriority,
          recurringIntervalDays: newItemInterval
        })
      });
      setNewItemName('');
      setIsAddingItem(false);
      fetchHousehold();
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    }
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    try {
      await request(`/household/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPurchased: !currentStatus })
      });
      fetchHousehold();
    } catch (err: any) {
      alert(`Could not update item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await request(`/household/items/${itemId}`, { method: 'DELETE' });
      fetchHousehold();
    } catch (err: any) {
      alert(`Could not delete item: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ELLogo variant="dark" size={60} className="mx-auto" />
        <h3 className="font-black text-slate-900 text-xl">Household Operating System</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Share grocery lists, manage monthly family budgets, and automate recurring pantry staples with your family in Indore.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
        >
          Sign In to Access Household
        </button>
      </div>
    );
  }

  const spendPct = household
    ? Math.min(100, Math.round((household.monthlySpendPaise / (household.monthlyBudgetPaise || 1)) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-1 flex items-center gap-1"
          >
            ← Back to Shopping
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {household?.name || 'My Household'}
          </h1>
          <p className="text-xs text-slate-500">
            Family replenishment manager, monthly grocery cap & recurring essentials
          </p>
        </div>

        <button
          onClick={() => setIsAddingItem(true)}
          className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Item</span>
        </button>
      </div>

      {/* Budget & Spend Progress Card */}
      {household && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Monthly Family Budget
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatPaise(household.monthlySpendPaise)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  spent of {formatPaise(household.monthlyBudgetPaise)} cap
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                spendPct > 85 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {spendPct}% Used
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spendPct > 85 ? 'bg-rose-500' : 'bg-forest-800'
              }`}
              style={{ width: `${spendPct}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Add Item Form Modal */}
      {isAddingItem && (
        <div className="bg-amber-50/60 rounded-3xl border-2 border-amber-300 p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Add Recurring Pantry Essential
            </h3>
            <button onClick={() => setIsAddingItem(false)} className="text-xs text-slate-500 font-bold">
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Product / Item Name</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Sanchi Pasteurized Milk 500ml"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Repeat Every</label>
              <select
                value={newItemInterval}
                onChange={(e) => setNewItemInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              >
                <option value={1}>Daily</option>
                <option value={3}>Every 3 Days</option>
                <option value={7}>Weekly (7 Days)</option>
                <option value={14}>Bi-Weekly (14 Days)</option>
                <option value={30}>Monthly (30 Days)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Priority</label>
              <select
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition active:scale-95"
              >
                Save Recurring Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shopping List Items */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Household Shared Shopping & Replenishment List
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {household?.shoppingItems.length || 0} Items
          </span>
        </div>

        {(!household || household.shoppingItems.length === 0) ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No recurring replenishment items yet. Click &quot;Add Recurring Item&quot; to set up your family essentials.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {household.shoppingItems.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePurchased(item.id, item.isPurchased)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                      item.isPurchased
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-slate-400 text-transparent'
                    }`}
                  >
                    ✓
                  </button>

                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        item.isPurchased ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.productName}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>Qty: {item.quantity}</span>
                      {item.recurringIntervalDays && (
                        <>
                          <span>•</span>
                          <span className="text-forest-800 font-semibold">
                            Every {item.recurringIntervalDays} days
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className={`font-bold ${
                        item.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Members */}
      {household && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Household Family Members ({household.members.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {household.members.map((m) => (
              <div
                key={m.id}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                  {m.user.name ? m.user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="font-bold text-slate-800">{m.user.name || m.user.email}</span>
                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
