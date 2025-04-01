import React, { useState } from 'react';
import i18n from '@/lib/i18n';

const GPSPanel: React.FC = () => {
  const [destination, setDestination] = useState('');
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-[#1E1E1E]">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input 
                type="text" 
                placeholder={i18n.t('gps.searchPlaceholder')} 
                className="w-full p-3 rounded-lg text-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <button 
                className="absolute right-2 top-2 p-1 bg-[#f89422] rounded text-[#121212]"
                onClick={() => {/* Search functionality would go here */}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <button className="bg-[#2D2D2D] p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative bg-[#2D2D2D]">
        {/* Map container */}
        <div className="h-full w-full bg-[#1A2530]">
          {/* Simplified map visualization */}
          <div className="h-full w-full relative overflow-hidden">
            {/* Stylized map with subtle grid lines */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
              {Array(144).fill(0).map((_, index) => (
                <div key={index} className="border-[0.5px] border-[#2A3540] col-span-1 row-span-1"></div>
              ))}
            </div>
            
            {/* Main roads */}
            <div className="absolute inset-0">
              <div className="h-1 bg-[#3A4550] absolute top-1/4 left-0 right-0 transform -rotate-6"></div>
              <div className="h-2 bg-[#3A4550] absolute top-1/2 left-0 right-0"></div>
              <div className="w-2 bg-[#3A4550] absolute top-0 bottom-0 left-1/3"></div>
              <div className="w-1 bg-[#3A4550] absolute top-0 bottom-0 right-1/4 transform rotate-3"></div>
            </div>
            
            {/* Current location marker */}
            <div className="absolute top-[45%] left-[48%]">
              <div className="h-4 w-4 rounded-full bg-[#f89422] animate-ping absolute opacity-75"></div>
              <div className="h-4 w-4 rounded-full bg-[#f89422] relative"></div>
            </div>
          </div>
        </div>
        
        {/* Map controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button className="bg-[#121212] p-2 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="bg-[#121212] p-2 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        
        {/* Navigation info */}
        <div className="absolute bottom-4 left-4 bg-[#121212] p-3 rounded-lg shadow-lg max-w-xs">
          <div className="font-bold text-lg mb-1">Voie rapide 401</div>
          <div className="text-sm opacity-80 mb-2">{i18n.t('gps.direction')}: {i18n.t('gps.east')} - 12 km</div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{i18n.t('gps.continueForward')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSPanel;
