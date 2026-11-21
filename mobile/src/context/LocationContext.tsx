import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationCoords, INDORE_NEIGHBORHOODS, LocationService } from '../utils/location';

interface LocationContextType {
  coords: LocationCoords;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (name: string) => void;
  refreshLocation: () => Promise<void>;
  isGpsActive: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<LocationCoords>(INDORE_NEIGHBORHOODS.PALASIA);
  const [selectedNeighborhood, setSelectedNeighborhoodState] = useState<string>('Palasia, Indore');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);

  const refreshLocation = async () => {
    const loc = await LocationService.getCurrentLocation();
    setCoords(loc);
    setIsGpsActive(true);
  };

  const setSelectedNeighborhood = (name: string) => {
    setSelectedNeighborhoodState(name);
    // Find matching neighborhood key
    const match = Object.values(INDORE_NEIGHBORHOODS).find((n) => n.neighborhood === name);
    if (match) {
      setCoords(match);
      setIsGpsActive(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{ coords, selectedNeighborhood, setSelectedNeighborhood, refreshLocation, isGpsActive }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
