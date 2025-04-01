// Type definitions for application state and data

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export type NetworkStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'none';

export interface WeatherData {
  location: string;
  temperature: number;
  conditions: string;
  updatedAt: Date;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface AccidentVehicleInfo {
  licensePlate: string;
  makeModel: string;
  year: number;
  color: string;
}

export interface AccidentReport {
  dateTime: Date;
  location: string;
  description: string;
  weatherConditions: string;
  roadConditions: string;
  vehicle1: AccidentVehicleInfo;
  vehicle2?: AccidentVehicleInfo;
}

export interface ViolationReport {
  dateTime: Date;
  location: string;
  violationType: string;
  severity: string;
  description: string;
  licensePlate: string;
  makeModel: string;
  driverName: string;
  licenseNumber: string;
  notes?: string;
}

export interface WantedPerson {
  id: number;
  personId: string;
  name: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  lastLocation: string;
  lastSeen: Date;
  warrants: string;
  dangerLevel: string; // 'Dangereux' or 'Surveillance'
}

export type PanelType = 'gps' | 'accident-report' | 'violation-report' | 'wanted-persons';

export type AppState = {
  connectionStatus: ConnectionStatus;
  networkStatus: NetworkStatus;
  activePanel: PanelType;
  weather?: WeatherData;
};
