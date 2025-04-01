import React, { useState, useRef, useEffect } from 'react';
import i18n from '@/lib/i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import './leaflet.css';
import Fuse from 'fuse.js';

// Interface pour les résultats de recherche d'adresse
interface LocationResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

// Instructions de navigation
interface NavigationInstruction {
  text: string;
  distance: number;
  time: number;
  type: string;
  index?: number;
}

const GPSPanel: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<L.Marker | null>(null);
  const [routeControl, setRouteControl] = useState<L.Routing.Control | null>(null);
  const [navigationInstructions, setNavigationInstructions] = useState<NavigationInstruction[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [addressDatabase, setAddressDatabase] = useState<LocationResult[]>([]);
  const [fuseSearch, setFuseSearch] = useState<Fuse<LocationResult> | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialiser la carte avec Leaflet
  useEffect(() => {
    if (mapRef.current && !map) {
      // Configuration de la carte centrée sur l'Ontario
      const initialMap = L.map(mapRef.current, {
        center: [43.6532, -79.3832], // Toronto par défaut
        zoom: 10,
        zoomControl: false, // Nous allons ajouter nos propres contrôles
      });

      // Ajouter une couche de tuiles (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(initialMap);

      // Conserver la référence à la carte
      setMap(initialMap);
      mapInstanceRef.current = initialMap;

      // Configurer les icônes personnalisées pour éviter les problèmes de chemins relatifs
      configureLeafletIcons();

      // Charger la base de données d'adresses simulée pour l'Ontario
      // Dans une version réelle, cela serait remplacé par une API
      loadAddressDatabase();

      // Nettoyer la carte lors du démontage du composant
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Configurer les icônes de Leaflet pour éviter les problèmes de chemins relatifs
  const configureLeafletIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  };

  // Charger la base de données d'adresses simulée pour l'Ontario
  const loadAddressDatabase = async () => {
    try {
      // Données simulées pour l'Ontario
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

      // Configurer Fuse.js pour la recherche floue
      const fuseOptions = {
        includeScore: true,
        keys: ['name', 'address'],
        threshold: 0.4, // Plus la valeur est basse, plus la correspondance doit être précise
      };

      setFuseSearch(new Fuse(ontarioAddresses, fuseOptions));
    } catch (error) {
      console.error('Erreur lors du chargement de la base de données d\'adresses:', error);
    }
  };

  // Obtenir la géolocalisation réelle
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude);
        setLocationPermissionDenied(false);

        // Si une carte existe, centrer dessus
        if (map) {
          map.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        setLocationPermissionDenied(true);
        
        // Utiliser une position par défaut si l'utilisateur refuse la permission
        const defaultLocation = { lat: 43.6532, lng: -79.3832 }; // Toronto
        updateUserLocation(defaultLocation.lat, defaultLocation.lng);
        
        alert("Permission de géolocalisation refusée. Utilisation d'une position par défaut.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Mettre à jour la position de l'utilisateur
  const updateUserLocation = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });

    // Mettre à jour ou créer le marqueur utilisateur
    if (map) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        // Créer un marqueur utilisateur personnalisé
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `<div class="h-4 w-4 rounded-full bg-[#f89422] relative"></div>
                 <div class="h-4 w-4 rounded-full bg-[#f89422] animate-ping absolute opacity-75"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const newUserMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        setUserMarker(newUserMarker);
      }
    }
  };

  // Rechercher une adresse avec la recherche floue
  useEffect(() => {
    if (fuseSearch && destination.trim().length > 2) {
      const results = fuseSearch.search(destination);
      const validResults = results
        .filter(result => result.score && result.score < 0.5) // Filtre par pertinence
        .map(result => result.item);
      
      setSearchResults(validResults);
      setShowResults(validResults.length > 0);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [destination, fuseSearch]);

  // Gérer la recherche à partir de la barre
  const handleSearch = () => {
    if (destination.trim().length > 0 && searchResults.length > 0) {
      selectDestination(searchResults[0]);
    } else if (destination.trim().length > 0) {
      // Si pas de résultats mais l'utilisateur a entré quelque chose, essayer la recherche géocodage
      geocodeAddress(destination);
    }
  };

  // Recherche d'adresse via l'API de géocodage
  const geocodeAddress = async (address: string) => {
    try {
      const apiKey = import.meta.env.VITE_GEOCODING_API_KEY;
      const url = `https://geocode.maps.co/search?q=${encodeURIComponent(address + ', Ontario, Canada')}&api_key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Traiter les résultats
        const results: LocationResult[] = data.slice(0, 5).map((item: any, index: number) => ({
          id: `geo-${index}`,
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name
        }));
        
        setSearchResults(results);
        setShowResults(true);
        
        if (results.length > 0) {
          selectDestination(results[0]);
        }
      } else {
        alert("Aucune adresse trouvée.");
      }
    } catch (error) {
      console.error("Erreur lors du géocodage de l'adresse:", error);
      alert("Erreur lors de la recherche de l'adresse.");
    }
  };

  // Sélectionner une destination
  const selectDestination = (location: LocationResult) => {
    setSelectedLocation(location);
    setDestination(location.name);
    setShowResults(false);
    
    if (map) {
      // Centrer la carte entre l'utilisateur et la destination
      if (userLocation) {
        const bounds = L.latLngBounds(
          [userLocation.lat, userLocation.lng],
          [location.lat, location.lng]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([location.lat, location.lng], 14);
      }
      
      // Ajouter ou mettre à jour le marqueur de destination
      if (destinationMarker) {
        destinationMarker.setLatLng([location.lat, location.lng]);
      } else {
        const newDestMarker = L.marker([location.lat, location.lng]).addTo(map);
        newDestMarker.bindPopup(location.name).openPopup();
        setDestinationMarker(newDestMarker);
      }
    }
    
    // Supprimer l'itinéraire existant
    if (routeControl && map) {
      map.removeControl(routeControl);
      setRouteControl(null);
    }
    
    setIsNavigating(false);
    setNavigationInstructions([]);
    setCurrentInstruction(null);
  };

  // Calculer l'itinéraire entre la position utilisateur et la destination
  const calculateRoute = () => {
    if (!map || !userLocation || !selectedLocation) return;
    
    // Supprimer l'ancien itinéraire s'il existe
    if (routeControl) {
      map.removeControl(routeControl);
    }
    
    const waypoints = [
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(selectedLocation.lat, selectedLocation.lng)
    ];
    
    // Créer un nouveau contrôle d'itinéraire
    const newRouteControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#f89422', opacity: 0.8, weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      fitSelectedRoutes: true,
      altLineOptions: {
        styles: [{ color: '#f89422', opacity: 0.4, weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      // Ne pas créer de marqueurs supplémentaires dans les waypoints
    }).addTo(map);
    
    setRouteControl(newRouteControl);
    
    // Écouter les événements de routage pour obtenir les instructions
    newRouteControl.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes.length > 0) {
        const route = routes[0];
        
        // Extraire les instructions de navigation
        const instructions = route.instructions.map((instruction: any, index: number) => ({
          text: instruction.text,
          distance: instruction.distance,
          time: instruction.time,
          type: instruction.type,
          index
        }));
        
        setNavigationInstructions(instructions);
        
        // Définir la première instruction
        if (instructions.length > 0) {
          setCurrentInstruction(instructions[0]);
          startNavigation(instructions);
        }
      }
    });
  };

  // Démarrer la navigation
  const startNavigation = (instructions: NavigationInstruction[]) => {
    setIsNavigating(true);
    
    // Annoncer vocalement la première instruction
    if (instructions.length > 0) {
      speakInstruction(instructions[0]);
    }
  };

  // Arrêter la navigation
  const stopNavigation = () => {
    setIsNavigating(false);
    
    // Arrêter la synthèse vocale
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Supprimer l'itinéraire
    if (routeControl && map) {
      map.removeControl(routeControl);
      setRouteControl(null);
    }
    
    setNavigationInstructions([]);
    setCurrentInstruction(null);
  };

  // Parler une instruction de navigation
  const speakInstruction = (instruction: NavigationInstruction) => {
    if (!('speechSynthesis' in window)) {
      console.warn("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }
    
    // Arrêter toute voix en cours
    window.speechSynthesis.cancel();
    
    // Préparer le texte à prononcer
    const distance = Math.round(instruction.distance / 100) / 10; // Convertir en km avec une décimale
    let text = '';
    
    if (instruction.type === 'Straight') {
      text = `Continuez tout droit sur ${distance} kilomètres.`;
    } else if (instruction.type === 'SlightRight') {
      text = `Dans ${distance} kilomètres, légère droite.`;
    } else if (instruction.type === 'Right') {
      text = `Dans ${distance} kilomètres, tournez à droite.`;
    } else if (instruction.type === 'SharpRight') {
      text = `Dans ${distance} kilomètres, tournez fortement à droite.`;
    } else if (instruction.type === 'SlightLeft') {
      text = `Dans ${distance} kilomètres, légère gauche.`;
    } else if (instruction.type === 'Left') {
      text = `Dans ${distance} kilomètres, tournez à gauche.`;
    } else if (instruction.type === 'SharpLeft') {
      text = `Dans ${distance} kilomètres, tournez fortement à gauche.`;
    } else if (instruction.type === 'WaypointReached') {
      text = `Arrivée à destination.`;
    } else if (instruction.type === 'Roundabout') {
      text = `Dans ${distance} kilomètres, prenez le rond-point.`;
    } else {
      text = instruction.text + ` ${distance} kilomètres.`;
    }
    
    // Créer une instance de SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurer la voix (français)
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.includes('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    
    utterance.lang = 'fr-FR';
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    // Indiquer que la voix est en train de parler
    setIsSpeaking(true);
    
    // Événement lorsque la voix a fini de parler
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    // Parler
    window.speechSynthesis.speak(utterance);
  };

  // Formater une distance en texte
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance} m`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  // Formater un temps en texte
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} h ${remainingMinutes} min`;
    }
  };

  useEffect(() => {
    // Initialiser la position de l'utilisateur au chargement
    handleGeolocate();
    
    // Obtenir les voix disponibles pour la synthèse vocale
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

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
            title="Localiser ma position"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Carte Leaflet */}
      <div className="flex-1 relative bg-[#1A2530] overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-full w-full bg-[#1A2530]"
        ></div>
        
        {/* Instructions de navigation */}
        {isNavigating && currentInstruction && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 px-4 py-2 rounded-lg text-white max-w-sm text-center z-[1000]">
            <div className="font-bold text-lg">
              {currentInstruction.text}
            </div>
            <div className="text-sm">
              {formatDistance(currentInstruction.distance)} - {formatTime(currentInstruction.time)}
            </div>
          </div>
        )}
        
        {/* Bouton "Aller" */}
        {selectedLocation && userLocation && !isNavigating && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button 
              className="bg-[#f89422] text-black font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-[#f8a542] transition-colors"
              onClick={calculateRoute}
            >
              Aller
            </button>
          </div>
        )}
        
        {/* Bouton d'arrêt de navigation */}
        {isNavigating && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button 
              className="bg-red-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
              onClick={stopNavigation}
            >
              Arrêter
            </button>
          </div>
        )}
        
        {/* Liste d'instructions de navigation */}
        {isNavigating && navigationInstructions.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-[#121212] p-3 rounded-lg shadow-lg max-w-xs overflow-y-auto max-h-48 z-[1000]">
            <div className="font-bold text-lg mb-2">Instructions</div>
            {navigationInstructions.map((instruction, index) => (
              <div 
                key={index} 
                className={`p-2 rounded mb-1 flex items-center ${
                  currentInstruction && currentInstruction.index === index 
                    ? 'bg-[#f89422] text-black' 
                    : 'bg-[#2D2D2D]'
                }`}
                onClick={() => {
                  setCurrentInstruction(instruction);
                  speakInstruction(instruction);
                }}
              >
                <div className="mr-2">
                  {getInstructionIcon(instruction.type)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{instruction.text}</div>
                  <div className="text-xs opacity-80">{formatDistance(instruction.distance)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Fonction pour obtenir l'icône correspondant au type d'instruction
function getInstructionIcon(type: string) {
  switch (type) {
    case 'Straight':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    case 'SlightRight':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    case 'Right':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'SlightLeft':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
      );
    case 'Left':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      );
    case 'WaypointReached':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'Roundabout':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-3 3" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
  }
}

export default GPSPanel;
