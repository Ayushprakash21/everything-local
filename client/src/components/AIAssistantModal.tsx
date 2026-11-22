import React, { useState } from 'react';
import { request, formatPaise } from '../api/client';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { BrandLogo } from './BrandLogo';
import { ELLogo } from './ELLogo';
import {
  Sparkles,
  X,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  TrendingDown,
  Clock,
  ArrowRight,
  Bot,
  User,
  Store,
  Layers
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  openAuth: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedItems?: Array<{ name: string; quantity: number }>;
}

interface BasketOption {
  type: string;
  label: string;
  deliveryTier: string;
  deliveryTimeMins: number;
  storeCount: number;
  itemSubtotalPaise: number;
  estimatedDeliveryPaise: number;
  totalCostPaise: number;
  feasibility: boolean;
  items: Array<{
    productId: string;
    productName: string;
    storeId: string;
    storeName: string;
    pricePaise: number;
    quantity: number;
  }>;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  openAuth
}) => {
  const { coords, selectedLocation } = useLocation();
  const { addItem, clearCart, setIsCartOpen } = useCart();

  const [activeTab, setActiveTab] = useState<'chat' | 'optimizer'>('optimizer');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Namaste! I am your Everything Local AI Shopping Assistant in Indore. Ask me for recipes, grocery meal kits, price comparisons, or budget optimization.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Optimizer state
  const [optimizerQuery, setOptimizerQuery] = useState('Milk, Poha, Onions, Tea, Bananas');
  const [optimizing, setOptimizing] = useState(false);
  const [basketOptions, setBasketOptions] = useState<BasketOption[] | null>(null);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);

  const sampleMealPrompts = [
    { title: 'Indori Poha Breakfast (4 People)', query: 'Poha, Sev, Mustard seeds, Green chilli, Lemons, Peanuts' },
    { title: 'Dal Bafla Sunday Feast', query: 'Atta, Tuvar dal, Pure Ghee, Garlic, Red chilli' },
    { title: 'High-Protein Gym Staples', query: 'Eggs, Paneer, Milk, Peanut Butter, Bananas' },
    { title: 'Weekly Household Essentials', query: 'Aashirvaad Atta, Fortune Oil, Tata Salt, Sugar, Rice' }
  ];

  // Run Basket Optimizer
  const handleRunOptimizer = async (queryText?: string) => {
    const rawItems = (queryText || optimizerQuery)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawItems.length === 0) {
      setOptimizerError('Please enter at least one grocery or medical item');
      return;
    }

    setOptimizing(true);
    setOptimizerError(null);
    try {
      const itemsPayload = rawItems.map((name) => ({ name, quantity: 1 }));
      const res = await request<{ options: BasketOption[] }>('/ai/optimize-basket', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsPayload,
          customerLat: coords.latitude,
          customerLng: coords.longitude
        })
      });
      setBasketOptions(res.options);
    } catch (err: any) {
      setOptimizerError(err.message || 'Basket optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  // Apply basket option to cart
  const handleApplyBasket = async (option: BasketOption) => {
    try {
      await clearCart();
      for (const item of option.items) {
        await addItem(item.storeId, item.productId, item.quantity);
      }
      onClose();
      setIsCartOpen(true);
    } catch (err: any) {
      alert(`Could not add items to cart: ${err.message}`);
    }
  };

  // Handle chat submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setChatLoading(true);

    try {
      const res = await request<{ reply: string; suggestedItems?: any[] }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText })
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          suggestedItems: res.suggestedItems
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the live Indore product index.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-float relative animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-amber-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">AI Shopping Copilot</h3>
                <span className="text-[10px] font-black uppercase bg-forest-900 text-white px-2 py-0.5 rounded-full">
                  Indore
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                Smart Basket Optimizer • Recipe Builder • Price Comparison
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'optimizer' ? 'bg-white shadow-xs text-forest-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart Basket Optimizer</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chat' ? 'bg-white shadow-xs text-forest-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Recipe Assistant</span>
          </button>
        </div>

        {/* TAB 1: SMART BASKET OPTIMIZER */}
        {activeTab === 'optimizer' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Quick Meal Kit Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Popular Quick-Commerce Baskets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {sampleMealPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setOptimizerQuery(p.query);
                      handleRunOptimizer(p.query);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left bg-white hover:bg-amber-50/40 transition group"
                  >
                    <span className="text-xs font-black text-slate-900 block group-hover:text-amber-800">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.query}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom List Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Enter Grocery / Essentials List (comma separated):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optimizerQuery}
                  onChange={(e) => setOptimizerQuery(e.target.value)}
                  placeholder="e.g. Milk, Poha, Potatoes, Bread, Eggs"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => handleRunOptimizer()}
                  disabled={optimizing}
                  className="px-4 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{optimizing ? 'Comparing...' : 'Optimize'}</span>
                </button>
              </div>
            </div>

            {optimizerError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{optimizerError}</span>
              </div>
            )}

            {/* Comparison Results */}
            {basketOptions && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Basket Strategies Compared
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {basketOptions.length} Options Generated
                  </span>
                </div>

                <div className="space-y-3">
                  {basketOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 space-y-3 transition ${
                        opt.type === 'CHEAPEST'
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : opt.type === 'FASTEST_EXPRESS'
                          ? 'bg-amber-50/40 border-amber-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{opt.label}</span>
                            {opt.type === 'CHEAPEST' && (
                              <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                Lowest Cost
                              </span>
                            )}
                            {opt.type === 'FASTEST_EXPRESS' && (
                              <span className="text-[9px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                                15-20 Min Express
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Delivery in {opt.deliveryTimeMins} mins</span>
                            <span>•</span>
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>
                              {opt.storeCount} {opt.storeCount === 1 ? 'store' : 'stores consolidated'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">
                            {formatPaise(opt.totalCostPaise)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Items: {formatPaise(opt.itemSubtotalPaise)} + Del: {formatPaise(opt.estimatedDeliveryPaise)}
                          </span>
                        </div>
                      </div>

                      {/* Item Preview */}
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/80 text-[11px] divide-y divide-slate-100">
                        {opt.items.map((it, itemIdx) => (
                          <div key={itemIdx} className="py-1 flex items-center justify-between">
                            <span className="text-slate-800 font-medium truncate max-w-[200px]">
                              {it.quantity}x {it.productName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                {it.storeName}
                              </span>
                              <span className="font-bold text-slate-800">
                                {formatPaise(it.pricePaise * it.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleApplyBasket(opt)}
                        className="w-full py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Load This Basket into Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI RECIPE CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#0B1F3A] flex items-center justify-center shrink-0 p-1 shadow-2xs">
                      <BrandLogo variant="symbol" size="small" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-forest-900 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.suggestedItems && m.suggestedItems.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500 mb-1.5">
                          Suggested Ingredients:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.suggestedItems.map((item, i) => (
                            <span
                              key={i}
                              className="bg-white text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 font-semibold text-[10px]"
                            >
                              {item.name} ({item.quantity}x)
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const q = m.suggestedItems!.map((it) => it.name).join(', ');
                            setOptimizerQuery(q);
                            setActiveTab('optimizer');
                            handleRunOptimizer(q);
                          }}
                          className="mt-2.5 text-[10px] font-black text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <span>Compare prices for this recipe in Smart Optimizer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 items-center text-xs text-slate-400 italic">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask e.g. 'What ingredients do I need for Sev Tamatar?'"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 disabled:opacity-50 text-white rounded-xl text-xs font-black transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
