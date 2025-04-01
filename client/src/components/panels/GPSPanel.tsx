import React, { useState, useRef, useEffect } from 'react';
import i18n from '@/lib/i18n';

// Les destinations pour la recherche (simulées)
const DESTINATIONS = [
  { id: 1, name: '810 Rue Main, Niagara Falls, ON', lat: 43.104, lng: -79.068 },
  { id: 2, name: 'Chutes du Niagara, ON', lat: 43.0962, lng: -79.0377 },
  { id: 3, name: 'Centre-ville de Toronto, ON', lat: 43.6532, lng: -79.3832 },
  { id: 4, name: 'Highway 401, Toronto, ON', lat: 43.7615, lng: -79.3435 },
  { id: 5, name: 'Aéroport Pearson, Mississauga, ON', lat: 43.6777, lng: -79.6248 }
];

const GPSPanel: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState<typeof DESTINATIONS>([]);
  const [selectedLocation, setSelectedLocation] = useState<typeof DESTINATIONS[0] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [userLocation, setUserLocation] = useState({ lat: 43.7615, lng: -79.3435 });
  const [isDragging, setIsDragging] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [initialTouch, setInitialTouch] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);

  // Simuler la recherche de destinations
  useEffect(() => {
    if (destination.trim().length > 2) {
      const results = DESTINATIONS.filter(dest => 
        dest.name.toLowerCase().includes(destination.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [destination]);

  // Gérer la recherche à partir de la barre
  const handleSearch = () => {
    if (destination.trim().length > 0) {
      const firstResult = searchResults[0];
      if (firstResult) {
        selectDestination(firstResult);
      }
    }
  };

  // Simuler la géolocalisation
  const handleGeolocate = () => {
    // Simuler l'obtention de la position utilisateur
    setUserLocation({ 
      lat: 43.7615 + (Math.random() * 0.02 - 0.01), 
      lng: -79.3435 + (Math.random() * 0.02 - 0.01) 
    });
    
    // Centrer la carte sur la position utilisateur
    setMapOffset({ x: 0, y: 0 });
    
    // Notification
    alert(i18n.t('gps.currentLocation') + ": Toronto, ON");
  };

  // Sélectionner une destination
  const selectDestination = (location: typeof DESTINATIONS[0]) => {
    setSelectedLocation(location);
    setDestination(location.name);
    setShowResults(false);
    // Réinitialiser l'offset de la carte pour centrer
    setMapOffset({ x: 0, y: 0 });
  };

  // Zoom in
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  // Zoom out
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
  };

  // Démarrer le déplacement de la carte (souris)
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setInitialTouch({ x: e.clientX, y: e.clientY });
  };

  // Démarrer le déplacement de la carte (tactile)
  const startTouchDrag = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setInitialTouch({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  // Continuer le déplacement de la carte (souris)
  const doDrag = (e: React.MouseEvent) => {
    if (isDragging && mapRef.current) {
      const deltaX = e.clientX - initialTouch.x;
      const deltaY = e.clientY - initialTouch.y;
      
      setMapOffset(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      setInitialTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Continuer le déplacement de la carte (tactile)
  const doTouchDrag = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && mapRef.current) {
      const deltaX = e.touches[0].clientX - initialTouch.x;
      const deltaY = e.touches[0].clientY - initialTouch.y;
      
      setMapOffset(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      setInitialTouch({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  // Arrêter le déplacement
  const endDrag = () => {
    setIsDragging(false);
  };

  const calculateDistance = () => {
    if (!selectedLocation) return 0;
    
    // Calcul de distance réel (formule de Haversine)
    const R = 6371; // Rayon de la Terre en km
    const dLat = (selectedLocation.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (selectedLocation.lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(selectedLocation.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    
    return Math.round(distance);
  };

  const getDirection = () => {
    if (!selectedLocation) return i18n.t('gps.east');
    
    // Calcul de la direction
    const deltaLat = selectedLocation.lat - userLocation.lat;
    const deltaLng = selectedLocation.lng - userLocation.lng;
    
    if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
      return deltaLat > 0 ? i18n.t('gps.north') : i18n.t('gps.south');
    } else {
      return deltaLng > 0 ? i18n.t('gps.east') : i18n.t('gps.west');
    }
  };

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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="absolute right-2 top-2 p-1 bg-[#f89422] rounded text-[#121212]"
                onClick={handleSearch}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Résultats de recherche */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E1E] border border-[#3D3D3D] rounded-lg max-h-60 overflow-y-auto z-10">
                  {searchResults.map(result => (
                    <div 
                      key={result.id}
                      className="p-3 hover:bg-[#2D2D2D] cursor-pointer border-b border-[#3D3D3D] last:border-b-0"
                      onClick={() => selectDestination(result)}
                    >
                      <div className="text-[#f89422] font-medium">{result.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button 
            className="bg-[#2D2D2D] p-3 rounded-lg hover:bg-[#3D3D3D] transition-colors"
            onClick={handleGeolocate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        className="flex-1 relative bg-[#1A2530] overflow-hidden touch-auto"
        ref={mapRef}
        onMouseDown={startDrag}
        onMouseMove={doDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={startTouchDrag}
        onTouchMove={doTouchDrag}
        onTouchEnd={endDrag}
      >
        {/* Map container */}
        <div 
          className="h-full w-full bg-[#1A2530]"
          style={{ 
            transform: `scale(${zoomLevel}) translate(${mapOffset.x}px, ${mapOffset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            transformOrigin: 'center center'
          }}
        >
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
            
            {/* Destination marker (if selected) */}
            {selectedLocation && (
              <div className="absolute top-[30%] left-[60%]">
                <div className="h-8 w-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs whitespace-nowrap">
                  {selectedLocation.name.split(',')[0]}
                </div>
              </div>
            )}
            
            {/* Route line (if selected) */}
            {selectedLocation && (
              <div className="absolute inset-0 pointer-events-none">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <path 
                    d="M 48% 45% Q 55% 40%, 60% 30%" 
                    stroke="#f89422" 
                    strokeWidth="2" 
                    strokeDasharray="5,5" 
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Map instruction message */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 px-3 py-1 rounded-full text-sm text-white pointer-events-none">
          Touchez et faites glisser pour déplacer la carte
        </div>
        
        {/* Map controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button 
            className="bg-[#121212] p-2 rounded-lg shadow-lg hover:bg-[#1E1E1E] transition-colors"
            onClick={zoomIn}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button 
            className="bg-[#121212] p-2 rounded-lg shadow-lg hover:bg-[#1E1E1E] transition-colors"
            onClick={zoomOut}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        
        {/* Navigation info */}
        <div className="absolute bottom-4 left-4 bg-[#121212] p-3 rounded-lg shadow-lg max-w-xs">
          <div className="font-bold text-lg mb-1">
            {selectedLocation ? selectedLocation.name.split(',')[0] : 'Voie rapide 401'}
          </div>
          <div className="text-sm opacity-80 mb-2">
            {i18n.t('gps.direction')}: {getDirection()} - {selectedLocation ? calculateDistance() : 12} km
          </div>
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
