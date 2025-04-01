import React from 'react';
import { useWeatherData } from '@/lib/socket';

const WeatherWidget: React.FC = () => {
  const weather = useWeatherData();
  
  if (!weather) {
    return (
      <div className="flex items-center mr-4">
        <div className="text-beaver-orange font-medium animate-pulse">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span className="text-lg">--°C</span>
          </div>
          <div className="text-sm opacity-80">Chargement...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center mr-4">
      <div className="text-beaver-orange font-medium">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span className="text-lg">{weather.temperature}°C</span>
        </div>
        <div className="text-sm opacity-80">{weather.location}</div>
      </div>
    </div>
  );
};

export default WeatherWidget;
