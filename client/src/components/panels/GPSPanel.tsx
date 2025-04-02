import React, { useState, useRef, useEffect } from 'react';
import i18n from '@/lib/i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet.css';
import Fuse from 'fuse.js';

interface LocationResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

const GPSPanel: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<L.Marker | null>(null);
  const [addressDatabase, setAddressDatabase] = useState<LocationResult[]>([]);
  const [fuseSearch, setFuseSearch] = useState<Fuse<LocationResult> | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        const initialMap = L.map(mapRef.current, {
          center: [43.6532, -79.3832],
          zoom: 13,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          tap: true,
          keyboard: true,
          inertia: true,
          trackResize: true
        }).setView([43.6532, -79.3832], 13);

        try {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(initialMap);
        } catch (e) {
          console.error("Error loading OpenStreetMap tiles:", e);
          try {
            console.log("Attempting to load CartoDB tiles");
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, © <a href="https://carto.com/attributions">CARTO</a>',
              maxZoom: 19
            }).addTo(initialMap);
            console.log("CartoDB tiles loaded successfully");
          } catch (e2) {
            console.error("Error loading CartoDB tiles:", e2);
          }
        }

        setMap(initialMap);
        mapInstanceRef.current = initialMap;

        loadAddressDatabase();
      } catch (error) {
        console.error("Critical error initializing map:", error);
      }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  const loadAddressDatabase = async () => {
    try {
      const ontarioAddresses: LocationResult[] = [
        { id: '1', name: '810 Rue Main, Niagara Falls, ON', lat: 43.104, lng: -79.068, address: '810 Rue Main, Niagara Falls, Ontario' },
        { id: '2', name: 'Chutes du Niagara, ON', lat: 43.0962, lng: -79.0377, address: 'Niagara Falls, Ontario' },
        { id: '3', name: 'Centre-ville de Toronto, ON', lat: 43.6532, lng: -79.3832, address: 'Downtown Toronto, Ontario' },
        { id: '4', name: 'Highway 401, Toronto, ON', lat: 43.7615, lng: -79.3435, address: 'Highway 401, Toronto, Ontario' },
        { id: '5', name: 'Aéroport Pearson, Mississauga, ON', lat: 43.6777, lng: -79.6248, address: 'Toronto Pearson International Airport, Mississauga, Ontario' },
        { id: '6', name: 'Welland, ON', lat: 42.9922, lng: -79.2482, address: 'Welland, Ontario' },
        { id: '7', name: 'St. Catharines, ON', lat: 43.1594, lng: -79.2469, address: 'St. Catharines, Ontario' },
        { id: '8', name: 'Hamilton, ON', lat: 43.2557, lng: -79.8711, address: 'Hamilton, Ontario' },
        { id: '9', name: 'London, ON', lat: 42.9849, lng: -81.2453, address: 'London, Ontario' },
        { id: '10', name: 'Ottawa, ON', lat: 45.4215, lng: -75.6972, address: 'Ottawa, Ontario' },
      ];

      setAddressDatabase(ontarioAddresses);

      const fuseOptions = {
        includeScore: true,
        keys: ['name', 'address'],
        threshold: 0.4,
      };

      setFuseSearch(new Fuse(ontarioAddresses, fuseOptions));
    } catch (error) {
      console.error('Error loading address database:', error);
    }
  };

  const handleSearch = () => {
    if (destination.trim().length > 0 && searchResults.length > 0) {
      selectDestination(searchResults[0]);
    }
  };

  const selectDestination = (location: LocationResult) => {
    setSelectedLocation(location);
    setDestination(location.name);
    setShowResults(false);

    if (map) {
      map.setView([location.lat, location.lng], 14);

      if (destinationMarker) {
        destinationMarker.setLatLng([location.lat, location.lng]);
      } else {
        const newDestMarker = L.marker([location.lat, location.lng]).addTo(map);
        newDestMarker.bindPopup(location.name).openPopup();
        setDestinationMarker(newDestMarker);
      }
    }
  };

  useEffect(() => {
    if (fuseSearch && destination.trim().length > 2) {
      const results = fuseSearch.search(destination);
      const validResults = results
        .filter(result => result.score && result.score < 0.5)
        .map(result => result.item);

      setSearchResults(validResults);
      setShowResults(validResults.length > 0);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [destination, fuseSearch]);

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
        </div>
      </div>

      <div className="flex-1 relative bg-[#1A2530] overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-full w-full bg-[#1A2530]"
        ></div>
      </div>
    </div>
  );
};

export default GPSPanel;