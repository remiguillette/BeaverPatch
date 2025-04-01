import React, { createContext, useContext, useState, useEffect } from 'react';
import { PanelType, GPSLocation } from './types';

interface AppContextType {
  // Navigation GPS
  currentDestination: GPSLocation | null;
  setCurrentDestination: (destination: GPSLocation | null) => void;
  isNavigating: boolean;
  setIsNavigating: (isNavigating: boolean) => void;
  
  // Formulaire accident - stockage temporaire
  accidentFormData: any | null;
  setAccidentFormData: (data: any | null) => void;
  
  // Mise à jour des panneaux
  lastRefreshTime: {
    accidentReports: Date | null;
    violationReports: Date | null;
    wantedPersons: Date | null;
  };
  refreshPanel: (panel: 'accidentReports' | 'violationReports' | 'wantedPersons') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // État de la navigation GPS
  const [currentDestination, setCurrentDestination] = useState<GPSLocation | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  
  // État du formulaire d'accident - stockage temporaire
  const [accidentFormData, setAccidentFormData] = useState<any | null>(null);
  
  // Dernières mises à jour des données
  const [lastRefreshTime, setLastRefreshTime] = useState({
    accidentReports: null as Date | null,
    violationReports: null as Date | null,
    wantedPersons: null as Date | null,
  });
  
  // Restaurer les données du localStorage au démarrage
  useEffect(() => {
    try {
      const savedAccidentForm = localStorage.getItem('accidentFormData');
      if (savedAccidentForm) {
        setAccidentFormData(JSON.parse(savedAccidentForm));
      }
      
      const savedDestination = localStorage.getItem('currentDestination');
      if (savedDestination) {
        setCurrentDestination(JSON.parse(savedDestination));
        setIsNavigating(localStorage.getItem('isNavigating') === 'true');
      }
    } catch (error) {
      console.error('Erreur lors de la restauration des données:', error);
    }
  }, []);
  
  // Sauvegarder les données du formulaire d'accident dans localStorage quand elles changent
  useEffect(() => {
    if (accidentFormData) {
      localStorage.setItem('accidentFormData', JSON.stringify(accidentFormData));
    } else {
      localStorage.removeItem('accidentFormData');
    }
  }, [accidentFormData]);
  
  // Sauvegarder les données de navigation GPS dans localStorage
  useEffect(() => {
    if (currentDestination) {
      localStorage.setItem('currentDestination', JSON.stringify(currentDestination));
      localStorage.setItem('isNavigating', String(isNavigating));
    } else {
      localStorage.removeItem('currentDestination');
      localStorage.removeItem('isNavigating');
    }
  }, [currentDestination, isNavigating]);
  
  // Fonction pour marquer un panneau comme actualisé
  const refreshPanel = (panel: 'accidentReports' | 'violationReports' | 'wantedPersons') => {
    setLastRefreshTime(prev => ({
      ...prev,
      [panel]: new Date()
    }));
  };
  
  return (
    <AppContext.Provider
      value={{
        currentDestination,
        setCurrentDestination,
        isNavigating,
        setIsNavigating,
        accidentFormData,
        setAccidentFormData,
        lastRefreshTime,
        refreshPanel
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};