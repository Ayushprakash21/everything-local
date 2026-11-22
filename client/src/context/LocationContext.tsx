import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GeocodedLocation, ServiceabilityInfo, CustomerAddress } from '../types';
import { request } from '../api/client';
import { useAuth } from './AuthContext';

interface LocationContextType {
  coords: { latitude: number; longitude: number };
  selectedLocation: GeocodedLocation | null;
  serviceability: ServiceabilityInfo | null;
  isGpsDetecting: boolean;
  gpsPermissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  gpsError: string | null;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  savedAddresses: CustomerAddress[];
  recentLocations: GeocodedLocation[];
  detectGpsLocation: () => Promise<boolean>;
  selectLocation: (loc: GeocodedLocation) => void;
  refreshServiceability: () => Promise<void>;
  saveCurrentAddress: (label: string, addressLine: string, landmark?: string) => Promise<void>;
  deleteSavedAddress: (id: string) => Promise<void>;
  setDefaultSavedAddress: (id: string) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'everything_local_selected_location';
const RECENT_LOCATIONS_KEY = 'everything_local_recent_locations';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 22.7533, // Default center of Indore (Vijay Nagar corridor) until detected
    longitude: 75.8937
  });
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);
  const [serviceability, setServiceability] = useState<ServiceabilityInfo | null>(null);
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [recentLocations, setRecentLocations] = useState<GeocodedLocation[]>([]);

  // Fetch Serviceability based on active coordinates
  const refreshServiceability = useCallback(async (customCoords?: { latitude: number; longitude: number }) => {
    const target = customCoords || coords;
    try {
      const res = await request<ServiceabilityInfo>(
        `/location/serviceability?lat=${target.latitude}&lng=${target.longitude}`
      );
      setServiceability(res);
    } catch (err) {
      console.warn('Failed to fetch serviceability:', err);
    }
  }, [coords]);

  // Fetch saved addresses from server for logged-in user
  const fetchSavedAddresses = useCallback(async () => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    try {
      const res = await request<{ addresses: CustomerAddress[] }>('/customer/addresses');
      setSavedAddresses(res.addresses || []);

      // If user has a default address and no location has been selected yet
      const defaultAddr = res.addresses?.find((a) => a.isDefault);
      if (defaultAddr && !selectedLocation) {
        const geocoded: GeocodedLocation = {
          id: `saved-${defaultAddr.id}`,
          name: `${defaultAddr.label}: ${defaultAddr.addressLine}`,
          locality: defaultAddr.landmark || defaultAddr.city,
          road: defaultAddr.addressLine,
          city: defaultAddr.city,
          state: 'Madhya Pradesh',
          pincode: defaultAddr.pincode,
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude,
          formattedAddress: `${defaultAddr.addressLine}, ${defaultAddr.city} - ${defaultAddr.pincode}`
        };
        setSelectedLocation(geocoded);
        setCoords({ latitude: defaultAddr.latitude, longitude: defaultAddr.longitude });
        refreshServiceability({ latitude: defaultAddr.latitude, longitude: defaultAddr.longitude });
      }
    } catch (err) {
      console.warn('Failed to fetch saved addresses:', err);
    }
  }, [user, selectedLocation, refreshServiceability]);

  // Load Recent Locations from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
      if (stored) {
        setRecentLocations(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // Update Recent Locations
  const addRecentLocation = (loc: GeocodedLocation) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter((item) => item.id !== loc.id && item.name !== loc.name);
      const updated = [loc, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Detect GPS Location via Browser Geolocation API
  const detectGpsLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setGpsPermissionStatus('unsupported');
      setGpsError('Geolocation is not supported by your browser');
      setIsLocationModalOpen(true);
      return false;
    }

    setIsGpsDetecting(true);
    setGpsError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsPermissionStatus('granted');
          setCoords({ latitude: lat, longitude: lng });

          try {
            // Reverse geocode via server location engine
            const res = await request<{ address: GeocodedLocation }>(
              `/location/reverse?lat=${lat}&lng=${lng}`
            );

            if (res.address) {
              setSelectedLocation(res.address);
              addRecentLocation(res.address);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.address));
              } catch {
                // ignore
              }
              await refreshServiceability({ latitude: lat, longitude: lng });
            }
            setIsGpsDetecting(false);
            resolve(true);
          } catch (err) {
            console.error('Reverse geocode error:', err);
            // Even if reverse geocoding API has a hiccup, record coordinates
            const fallback: GeocodedLocation = {
              id: `gps-${Date.now()}`,
              name: 'Current Location, Indore',
              locality: 'Indore',
              city: 'Indore',
              state: 'Madhya Pradesh',
              pincode: '452001',
              latitude: lat,
              longitude: lng,
              formattedAddress: `Detected Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Indore`
            };
            setSelectedLocation(fallback);
            await refreshServiceability({ latitude: lat, longitude: lng });
            setIsGpsDetecting(false);
            resolve(true);
          }
        },
        (error) => {
          setIsGpsDetecting(false);
          setGpsPermissionStatus('denied');
          let msg = 'Could not detect your location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please search your Indore locality or PIN code below.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable. Please choose an address.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please select your locality.';
          }
          setGpsError(msg);
          // If permission denied, open the search modal so user can pick their locality
          setIsLocationModalOpen(true);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [refreshServiceability]);

  // Initial Load: Check localStorage or trigger GPS
  useEffect(() => {
    const initializeLocation = async () => {
      // 1. Check if user already has a saved selected location in LocalStorage
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as GeocodedLocation;
          setSelectedLocation(parsed);
          setCoords({ latitude: parsed.latitude, longitude: parsed.longitude });
          refreshServiceability({ latitude: parsed.latitude, longitude: parsed.longitude });
          return;
        }
      } catch {
        // ignore
      }

      // 2. If no saved location, automatically request GPS
      const detected = await detectGpsLocation();
      if (!detected) {
        // If GPS wasn't detected, open modal so user is not stuck on a hardcoded assumption
        setIsLocationModalOpen(true);
      }
    };

    initializeLocation();
  }, []);

  // Update saved addresses when user changes
  useEffect(() => {
    fetchSavedAddresses();
  }, [user, fetchSavedAddresses]);

  // Select a location explicitly
  const selectLocation = (loc: GeocodedLocation) => {
    setSelectedLocation(loc);
    setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    addRecentLocation(loc);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
    refreshServiceability({ latitude: loc.latitude, longitude: loc.longitude });
    setIsLocationModalOpen(false);
  };

  // Save current address to account
  const saveCurrentAddress = async (label: string, addressLine: string, landmark?: string) => {
    if (!user || !selectedLocation) return;
    try {
      const res = await request<{ address: CustomerAddress }>('/customer/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label,
          addressLine,
          landmark,
          city: selectedLocation.city || 'Indore',
          pincode: selectedLocation.pincode || '452001',
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          isDefault: savedAddresses.length === 0
        })
      });
      setSavedAddresses((prev) => [res.address, ...prev]);
    } catch (err) {
      console.error('Failed to save address:', err);
      throw err;
    }
  };

  // Delete saved address
  const deleteSavedAddress = async (id: string) => {
    if (!user) return;
    try {
      await request(`/customer/addresses/${id}`, { method: 'DELETE' });
      setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete address:', err);
      throw err;
    }
  };

  // Set default saved address
  const setDefaultSavedAddress = async (id: string) => {
    if (!user) return;
    try {
      await request(`/customer/addresses/${id}/default`, { method: 'PUT' });
      setSavedAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
    } catch (err) {
      console.error('Failed to set default address:', err);
      throw err;
    }
  };

  return (
    <LocationContext.Provider
      value={{
        coords,
        selectedLocation,
        serviceability,
        isGpsDetecting,
        gpsPermissionStatus,
        gpsError,
        isLocationModalOpen,
        setIsLocationModalOpen,
        savedAddresses,
        recentLocations,
        detectGpsLocation,
        selectLocation,
        refreshServiceability,
        saveCurrentAddress,
        deleteSavedAddress,
        setDefaultSavedAddress
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
