import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import {
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  MapPin
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  locality: string;
  minPledgesNeeded: number;
  currentPledges: number;
  retailPricePaise: number;
  groupPricePaise: number;
  expiresAt: string;
  status: string;
  store: {
    id: string;
    name: string;
    locality: string;
  };
}

export const CommunityDealsView: React.FC<{ openAuth: () => void; onBack: () => void }> = ({
  openAuth,
  onBack
}) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledgingId, setPledgingId] = useState<string | null>(null);
  const [pledgeMessage, setPledgeMessage] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await request<{ campaigns: Campaign[] }>('/community/campaigns');
      setCampaigns(res.campaigns);
    } catch (err: any) {
      console.warn('Community campaigns fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handlePledge = async (campaignId: string) => {
    if (!user) {
      openAuth();
      return;
    }

    setPledgingId(campaignId);
    setPledgeMessage(null);
    try {
      const res = await request<{ message: string; campaign: Campaign }>(
        `/community/campaigns/${campaignId}/pledge`,
        { method: 'POST', body: JSON.stringify({ quantity: 1 }) }
      );
      setPledgeMessage(res.message);
      fetchCampaigns();
    } catch (err: any) {
      alert(`Could not join pledge: ${err.message}`);
    } finally {
      setPledgingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-1 flex items-center gap-1"
          >
            ← Back to Shopping
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Community Bulk Deals
            </h1>
            <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
              Indore Hyperlocal
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pool orders with your neighbours in Vijay Nagar, Palasia &amp; Rau to unlock wholesale group pricing!
          </p>
        </div>
      </div>

      {pledgeMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{pledgeMessage}</span>
          </div>
          <button onClick={() => setPledgeMessage(null)} className="font-bold text-emerald-700">✕</button>
        </div>
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No active campaigns in this zone</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Check back soon as merchants launch community group-buying deals for fresh seasonal produce and staple cartons.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((camp) => {
            const savingsPaise = camp.retailPricePaise - camp.groupPricePaise;
            const savingsPct = Math.round((savingsPaise / camp.retailPricePaise) * 100);
            const progressPct = Math.min(
              100,
              Math.round((camp.currentPledges / camp.minPledgesNeeded) * 100)
            );

            return (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-card hover:border-amber-400 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {camp.locality}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Save {savingsPct}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">{camp.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{camp.description}</p>
                    <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
                      Fulfillment Store: {camp.store.name}
                    </span>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-black text-slate-900">
                      {formatPaise(camp.groupPricePaise)}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {formatPaise(camp.retailPricePaise)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      (Save {formatPaise(savingsPaise)})
                    </span>
                  </div>

                  {/* Progress towards unlock */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600">
                        {camp.currentPledges} / {camp.minPledgesNeeded} Pledges Joined
                      </span>
                      <span className="text-forest-900">{progressPct}% Unlocked</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-800 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePledge(camp.id)}
                  disabled={pledgingId === camp.id}
                  className="w-full py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>{pledgingId === camp.id ? 'Joining Group...' : 'Pledge to Join Group Deal'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
