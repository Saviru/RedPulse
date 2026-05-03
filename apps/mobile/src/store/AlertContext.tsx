import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UrgencyLevel = 'URGENT' | 'CRITICAL' | 'Standard' | 'Routine';
export type RequesterType = 'hospital' | 'user';

export interface Alert {
  id: string;
  type: RequesterType;
  name: string;
  urgency: UrgencyLevel;
  bloodGroup: string;
  reason: string;
  details: string;
  createdAt: number;
  /** Backend emergency request id when created via API */
  requestId?: string;
  /** Backend alert notification id when donor can respond via API */
  backendAlertId?: string;
}

interface AlertContextProps {
  alerts: Alert[];
  dismissedIds: string[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  // Start with some default dummy alerts to show the radar is populated, but we can remove them if requested.
  // The user explicitly requested: "remove all hard coded alerts and hospitals like things."
  // So we will start with an empty array.
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const addAlert = (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <AlertContext.Provider
      value={{ alerts, dismissedIds, addAlert, removeAlert, dismissAlert }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertStore() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlertStore must be used within an AlertProvider');
  }
  return context;
}

export default function Ignore() { return null; }
