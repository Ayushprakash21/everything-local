import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { GeocodedLocation, CustomerAddress } from '../types';
import { request } from '../api/client';
import {
  MapPin,
  Navigation,
  Search,
  Clock,
  X,
  Home,
  Briefcase,
  Bookmark,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Building2,
  Sparkles
} from 'lucide-react';

export const LocationModal: React.FC = () => {
  const {
    selectedLocation,
    coords,
    serviceability,
    isLocationModalOpen,
    setIsLocationModalOpen,
    isGpsDetecting,
    gpsError,
    detectGpsLocation,
    selectLocation,
    savedAddresses,
    recentLocations,
    saveCurrentAddress,
    deleteSavedAddress,
    setDefaultSavedAddress
  } = useLocation();

  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [popularLocalities, setPopularLocalities] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLocationModalOpen]);

  // Fetch popular Indore localities
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await request<{ localities: GeocodedLocation[] }>('/location/localities');
        setPopularLocalities(res.localities || []);
      } catch (err) {
        console.warn('Failed to load popular localities:', err);
      }
    };
    fetchPopular();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await request<{ results: GeocodedLocation[] }>(
          `/location/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(res.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isLocationModalOpen) return null;

  const handleSelect = (loc: GeocodedLocation) => {
    selectLocation(loc);
  };

  const handleSelectSaved = (addr: CustomerAddress) => {
    const geocoded: GeocodedLocation = {
      id: `saved-${addr.id}`,
      name: `${addr.label}: ${addr.addressLine}`,
      locality: addr.landmark || addr.city,
      road: addr.addressLine,
      city: addr.city,
      state: 'Madhya Pradesh',
      pincode: addr.pincode,
      latitude: addr.latitude,
      longitude: addr.longitude,
      formattedAddress: `${addr.addressLine}, ${addr.city} - ${addr.pincode}`
    };
    selectLocation(geocoded);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine.trim()) return;
    setSavingAddress(true);
    try {
      await saveCurrentAddress(newLabel, newAddressLine.trim(), newLandmark.trim() || undefined);
      setIsAddingAddress(false);
      setNewAddressLine('');
      setNewLandmark('');
    } catch (err) {
      alert('Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-forest-900 text-amber-400 flex items-center justify-center font-black">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Select Delivery Location
              </h2>
              <p className="text-xs text-slate-500">
                Discover serviceable Indore neighbourhood stores
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Detection Action Card */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <button
            onClick={() => detectGpsLocation()}
            disabled={isGpsDetecting}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                {isGpsDetecting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                ) : (
                  <Navigation className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div>
                <span className="text-xs font-black text-forest-950 block">
                  {isGpsDetecting ? 'Detecting your coordinates...' : 'Detect My Current Location'}
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  Using device GPS for accurate door-to-door delivery
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-forest-800 bg-white px-2.5 py-1 rounded-xl shadow-2xs group-hover:bg-forest-900 group-hover:text-white transition">
              GPS
            </span>
          </button>

          {gpsError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Search Autocomplete Input */}
        <div className="p-4 sm:p-5 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indore locality, road, or PIN code (e.g. Vijay Nagar, 452010)"
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium transition shadow-2xs"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : isSearching ? (
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin absolute right-3 top-3" />
            ) : null}
          </div>

          {/* Tabs: Search & Popular vs Saved Addresses */}
          <div className="flex items-center gap-2 mt-3 text-xs font-bold border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'search'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Indore Localities
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'saved'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Addresses ({savedAddresses.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 space-y-4">
          {activeTab === 'search' ? (
            <>
              {/* If user is typing search query */}
              {searchQuery.trim().length > 0 ? (
                <div>
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Search Results ({searchResults.length})
                  </div>
                  {isSearching ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span>Searching Indore localities...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1.5">
                      {searchResults.map((loc) => {
                        const isCurrent =
                          selectedLocation &&
                          (selectedLocation.id === loc.id || selectedLocation.name === loc.name);
                        return (
                          <button
                            key={loc.id}
                            onClick={() => handleSelect(loc)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                              isCurrent
                                ? 'bg-amber-50/80 border-amber-400 shadow-2xs'
                                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/70'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <Building2 className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-black text-slate-900 block">
                                  {loc.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {loc.formattedAddress}
                                </span>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-4 h-4 text-forest-700 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
                      <p className="font-bold">No exact match for "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try searching by PIN code (e.g. 452010) or choose from the curated Indore hubs below.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Recently Selected Addresses */}
                  {recentLocations.length > 0 && (
                    <div>
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Recently Selected</span>
                      </div>
                      <div className="space-y-1.5">
                        {recentLocations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => handleSelect(loc)}
                            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-left transition"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {loc.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              PIN {loc.pincode}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Curated Popular Indore Localities Grid */}
                  <div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Popular Indore Hubs</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {popularLocalities.map((loc) => {
                        const isCurrent =
                          selectedLocation &&
                          (selectedLocation.id === loc.id || selectedLocation.name === loc.name);
                        return (
                          <button
                            key={loc.id}
                            onClick={() => handleSelect(loc)}
                            className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-amber-100/70 border-amber-500 shadow-2xs'
                                : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200/80 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 truncate">
                                {loc.locality}
                              </span>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate mt-0.5">
                              {loc.subLocality || 'Indore'} • {loc.pincode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Saved Addresses Tab */
            <div className="space-y-3">
              {savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition flex items-start justify-between gap-2"
                    >
                      <button
                        onClick={() => handleSelectSaved(addr)}
                        className="flex-1 text-left flex items-start gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shrink-0 mt-0.5">
                          {addr.label.toLowerCase() === 'work' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-900 text-white">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {addr.addressLine}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultSavedAddress(addr.id)}
                            className="p-1.5 text-[10px] font-bold text-slate-500 hover:text-forest-900 rounded-lg hover:bg-slate-200/60"
                            title="Set as Default"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => deleteSavedAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold">No saved addresses yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Save your home or office address for fast 1-tap checkout.
                  </p>
                </div>
              )}

              {/* Add Address Form Toggle */}
              {selectedLocation && (
                <div>
                  {isAddingAddress ? (
                    <form
                      onSubmit={handleSaveAddress}
                      className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-subtle"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Save Current Location
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {['Home', 'Work', 'Other'].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setNewLabel(lbl)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              newLabel === lbl
                                ? 'bg-forest-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="House / Flat / Floor No. & Building Name"
                        value={newAddressLine}
                        onChange={(e) => setNewAddressLine(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />

                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={newLandmark}
                        onChange={(e) => setNewLandmark(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />

                      <div className="text-[11px] text-slate-500">
                        Area: {selectedLocation.formattedAddress}
                      </div>

                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition"
                      >
                        {savingAddress ? 'Saving Address...' : 'Save & Confirm Address'}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-500 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition"
                    >
                      <Plus className="w-4 h-4 text-forest-700" />
                      <span>Save "{selectedLocation.locality || 'Current'}" to My Addresses</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Currently Active Location Status */}
        {selectedLocation && (
          <div className="p-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
              <span className="truncate text-slate-800 font-semibold">
                Delivering to: <strong className="font-black">{selectedLocation.name}</strong>
              </span>
            </div>
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="px-4 py-1.5 bg-forest-900 hover:bg-forest-950 text-white font-black text-xs rounded-xl shadow-xs transition shrink-0"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
