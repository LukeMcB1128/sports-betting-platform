import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ParlayLeg } from '../types';

interface ParlayContextValue {
  legs: ParlayLeg[];
  addLeg: (leg: ParlayLeg) => void;
  removeLeg: (gameId: string, betType: string, side: string) => void;
  hasLeg: (gameId: string, betType: string, side: string) => boolean;
  clearLegs: () => void;
}

const SESSION_KEY = 'sbp_parlay_legs';

const ParlayContext = createContext<ParlayContextValue>({
  legs: [],
  addLeg: () => {},
  removeLeg: () => {},
  hasLeg: () => false,
  clearLegs: () => {},
});

export const ParlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [legs, setLegs] = useState<ParlayLeg[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to sessionStorage whenever legs change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(legs));
    } catch {
      // sessionStorage unavailable — just skip persistence
    }
  }, [legs]);

  const addLeg = useCallback((leg: ParlayLeg) => {
    setLegs((prev) => {
      // Replace if same game+type+side already present
      const filtered = prev.filter(
        (l) => !(l.gameId === leg.gameId && l.betType === leg.betType && l.side === leg.side)
      );
      return [...filtered, leg];
    });
  }, []);

  const removeLeg = useCallback((gameId: string, betType: string, side: string) => {
    setLegs((prev) =>
      prev.filter((l) => !(l.gameId === gameId && l.betType === betType && l.side === side))
    );
  }, []);

  const hasLeg = useCallback(
    (gameId: string, betType: string, side: string) =>
      legs.some((l) => l.gameId === gameId && l.betType === betType && l.side === side),
    [legs]
  );

  const clearLegs = useCallback(() => setLegs([]), []);

  return (
    <ParlayContext.Provider value={{ legs, addLeg, removeLeg, hasLeg, clearLegs }}>
      {children}
    </ParlayContext.Provider>
  );
};

export const useParlay = () => useContext(ParlayContext);
