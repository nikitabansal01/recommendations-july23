"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Recommendation {
  title?: string;
  specificAction?: string;
  category?: string;
  researchBacking?: {
    summary: string;
    studies: unknown[];
  };
  contraindications?: unknown[];
  frequency?: string;
  expectedTimeline?: string;
  priority?: string;
}

interface CurrentRecommendationsContextType {
  currentRecommendations: Recommendation[];
  setCurrentRecommendations: (recommendations: Recommendation[]) => void;
  updateRecommendations: (newRecommendations: Recommendation[]) => void;
}

const CurrentRecommendationsContext = createContext<CurrentRecommendationsContextType | null>(null);

export function CurrentRecommendationsProvider({ children, initialRecommendations }: { 
  children: ReactNode; 
  initialRecommendations: Recommendation[] 
}) {
  const [currentRecommendations, setCurrentRecommendations] = useState<Recommendation[]>(initialRecommendations);

  const updateRecommendations = (newRecommendations: Recommendation[]) => {
    console.log('🔄 Updating current recommendations:', newRecommendations);
    setCurrentRecommendations(newRecommendations);
  };

  return (
    <CurrentRecommendationsContext.Provider value={{
      currentRecommendations,
      setCurrentRecommendations,
      updateRecommendations
    }}>
      {children}
    </CurrentRecommendationsContext.Provider>
  );
}

export function useCurrentRecommendations() {
  const context = useContext(CurrentRecommendationsContext);
  if (!context) {
    throw new Error('useCurrentRecommendations must be used within a CurrentRecommendationsProvider');
  }
  return context;
} 