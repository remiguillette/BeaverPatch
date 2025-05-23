import React, { useState, useRef, useEffect, useContext } from 'react';
import i18n from '@/lib/i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import './leaflet.css';
import Fuse from 'fuse.js';
// import { useAppContext } from '@/lib/AppContext';
import { GPSLocation } from '@/lib/types';
import { AgentPositionContext } from '@/lib/contexts/AgentPositionContext';

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
  // Valeurs par défaut sans contexte (temporaire)
  const currentDestination = null;
  const setCurrentDestination = (dest: any) => console.log('setCurrentDestination', dest);
  const globalIsNavigating = false;
  const setGlobalIsNavigating = (nav: boolean) => console.log('setIsNavigating', nav);
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(
    // Restaurer la destination précédente au chargement du composant
    currentDestination ? {
      id: `saved-${currentDestination.latitude}-${currentDestination.longitude}`,
      name: currentDestination.address || 'Destination sauvegardée',
      lat: currentDestination.latitude,
      lng: currentDestination.longitude,
      address: currentDestination.address
    } : null
  );
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<L.Marker | null>(null);
  const [routeControl, setRouteControl] = useState<L.Routing.Control | null>(null);
  const [navigationInstructions, setNavigationInstructions] = useState<NavigationInstruction[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  const [isNavigating, setIsNavigating] = useState(globalIsNavigating);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [addressDatabase, setAddressDatabase] = useState<LocationResult[]>([]);
  const [fuseSearch, setFuseSearch] = useState<Fuse<LocationResult> | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialiser la carte avec Leaflet
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      console.log("Initialisation de la carte Leaflet...");
      try {
        // Configuration de la carte centrée sur l'Ontario
        const initialMap = L.map(mapRef.current, {
          center: [43.6532, -79.3832], // Toronto par défaut
          zoom: 10,
          zoomControl: false, // Nous allons ajouter nos propres contrôles
        });

        // Fonction pour essayer plusieurs sources de tuiles
        const addTileLayers = () => {
          // Essayer d'abord OpenStreetMap
          try {
            console.log("Tentative de chargement des tuiles OpenStreetMap");
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 19,
            }).addTo(initialMap);
            console.log("Couche OpenStreetMap chargée avec succès");
            return true;
          } catch (e) {
            console.warn("Erreur lors du chargement des tuiles OpenStreetMap:", e);
            
            // Si ça échoue, essayer CartoDB comme alternative
            try {
              console.log("Tentative de chargement des tuiles CartoDB");
              L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, © <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
              }).addTo(initialMap);
              console.log("Couche CartoDB chargée avec succès");
              return true;
            } catch (e2) {
              console.error("Erreur lors du chargement des tuiles CartoDB:", e2);
              return false;
            }
          }
        };

        // Ajouter les tuiles de la carte
        const tilesLoaded = addTileLayers();
        if (!tilesLoaded) {
          console.error("Impossible de charger les couches de carte");
        }

        // Conserver la référence à la carte
        setMap(initialMap);
        mapInstanceRef.current = initialMap;
        console.log("Carte initialisée avec succès");

        // Configurer les icônes personnalisées pour éviter les problèmes de chemins relatifs
        try {
          configureLeafletIcons();
        } catch (e) {
          console.warn("Erreur lors de la configuration des icônes Leaflet:", e);
        }

        // Charger la base de données d'adresses
        loadAddressDatabase();
      } catch (error) {
        console.error("Erreur critique lors de l'initialisation de la carte:", error);
        alert("Erreur lors de l'initialisation de la carte. Veuillez rafraîchir la page.");
      }

      // Nettoyer la carte lors du démontage du composant
      return () => {
        if (mapInstanceRef.current) {
          console.log("Nettoyage de la carte Leaflet");
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
        // Villes principales
        { id: '1', name: 'Welland, ON', lat: 42.9922, lng: -79.2482, address: 'Welland, Ontario' },
        { id: '2', name: 'St. Catharines, ON', lat: 43.1594, lng: -79.2469, address: 'St. Catharines, Ontario' },
        { id: '3', name: 'Niagara Falls, ON', lat: 43.0896, lng: -79.0849, address: 'Niagara Falls, Ontario' },
        { id: '4', name: 'Fort Erie, ON', lat: 42.9087, lng: -78.9711, address: 'Fort Erie, Ontario' },
        { id: '5', name: 'Port Colborne, ON', lat: 42.8676, lng: -79.2513, address: 'Port Colborne, Ontario' },
        
        // Points d'intérêt Niagara
        { id: '6', name: 'Chutes du Niagara', lat: 43.0962, lng: -79.0377, address: 'Niagara Falls, Ontario' },
        { id: '7', name: 'Clifton Hill, Niagara Falls', lat: 43.0913, lng: -79.0744, address: 'Clifton Hill, Niagara Falls, Ontario' },
        { id: '8', name: 'Casino Niagara', lat: 43.0927, lng: -79.0705, address: 'Casino Niagara, Niagara Falls, Ontario' },
        
        // Centres commerciaux et magasins
        { id: '9', name: 'Walmart Supercentre Welland', lat: 42.9847, lng: -79.2483, address: '102 Primeway Dr, Welland, Ontario' },
        { id: '10', name: 'Seaway Mall', lat: 43.0023, lng: -79.2482, address: '800 Niagara St, Welland, Ontario' },
        { id: '11', name: 'Walmart Niagara Falls', lat: 43.1283, lng: -79.0859, address: '7481 Pin Oak Dr, Niagara Falls, Ontario' },
        { id: '12', name: 'Pen Centre', lat: 43.1397, lng: -79.2634, address: '221 Glendale Ave, St. Catharines, Ontario' },
        
        // Services d'urgence
        { id: '13', name: 'Welland Hospital', lat: 43.0247, lng: -79.2482, address: '65 Third Street, Welland, Ontario' },
        { id: '14', name: 'Niagara Falls Hospital', lat: 43.0913, lng: -79.0981, address: '5546 Portage Rd, Niagara Falls, Ontario' },
        { id: '15', name: 'St. Catharines Hospital', lat: 43.1785, lng: -79.2461, address: '1200 Fourth Ave, St. Catharines, Ontario' },
        
        // Postes de police
        { id: '16', name: 'Police Welland', lat: 42.9922, lng: -79.2477, address: '5 Lincoln St W, Welland, Ontario' },
        { id: '17', name: 'Police Niagara Falls', lat: 43.0935, lng: -79.0849, address: '4343 Morrison St, Niagara Falls, Ontario' },
        { id: '18', name: 'Police St. Catharines', lat: 43.1594, lng: -79.2469, address: '68 Church St, St. Catharines, Ontario' },
        
        // Routes principales
        { id: '19', name: 'QEW St. Catharines', lat: 43.1551, lng: -79.2697, address: 'Queen Elizabeth Way, St. Catharines, Ontario' },
        { id: '20', name: 'Highway 406', lat: 43.0922, lng: -79.2482, address: 'Highway 406, Welland, Ontario' }
      ];

      setAddressDatabase(ontarioAddresses);

      // Configurer Fuse.js pour la recherche floue
      const fuseOptions = {
        includeScore: true,
        keys: ['name', 'address'],
        threshold: 0.6, // Augmenter la tolérance pour plus de résultats
        distance: 100,
      };

      setFuseSearch(new Fuse(ontarioAddresses, fuseOptions));
    } catch (error) {
      console.error('Erreur lors du chargement de la base de données d\'adresses:', error);
    }
  };

  // Utiliser directement une position par défaut pour le développement/test
  const handleGeolocate = () => {
    console.log("Utilisation de la position par défaut pour le développement");
    // Position par défaut (Région de Niagara Falls)
    const defaultLocation = { lat: 43.0716, lng: -79.1010 };
    updateUserLocation(defaultLocation.lat, defaultLocation.lng);
    
    // Centrer la carte sur la position par défaut
    if (map) {
      map.setView([defaultLocation.lat, defaultLocation.lng], 12);
    }
  };

  // Utiliser une position par défaut en cas d'échec
  const fallbackToDefaultLocation = () => {
    // Position par défaut (Région de Niagara Falls)
    const defaultLocation = { lat: 43.0716, lng: -79.1010 };
    updateUserLocation(defaultLocation.lat, defaultLocation.lng);
    
    // Centrer la carte sur la position par défaut
    if (map) {
      map.setView([defaultLocation.lat, defaultLocation.lng], 10);
    }
  };

  // Mettre à jour la position de l'utilisateur
  const { updateAgentPosition } = useContext(AgentPositionContext);
  
  const updateUserLocation = (lat: number, lng: number) => {
    if (userLocation?.lat === lat && userLocation?.lng === lng) return;
    setUserLocation({ lat, lng });
    updateAgentPosition({ lat, lng });
    
    if (!mapInstanceRef.current) return;

    try {
      if (!map) return;
      
      if (!userMarker) {
        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }),
          zIndexOffset: 1000
        }).addTo(map);
        
        marker.bindPopup(`<b>Votre position actuelle</b><br>${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setUserMarker(marker);
      } else {
        userMarker.setLatLng([lat, lng]);
        userMarker.getPopup()?.setContent(`<b>Votre position actuelle</b><br>${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
      
      // Centrer la carte si autoCenter est activé
      if (autoCenter) {
        map.setView([lat, lng], 17, { animate: true });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du marqueur:", error);
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
      console.log("Recherche de l'adresse:", address);
      
      // Vérifier si la clé API est disponible
      const apiKey = import.meta.env.VITE_GEOCODING_API_KEY;
      if (!apiKey) {
        console.error("Clé API de géocodage manquante. Utilisation de la recherche locale uniquement.");
        fallbackToLocalSearch(address);
        return;
      }
        
      try {
        // Construire l'URL avec l'encodage approprié et ajout de "Ontario, Canada" pour cibler la région
        const url = `https://geocode.maps.co/search?q=${encodeURIComponent(address + ', Ontario, Canada')}&api_key=${apiKey}`;
        
        console.log("Requête API de géocodage...");
        const response = await fetch(url);
        
        // Vérifier si la réponse est valide
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erreur API géocodage (${response.status}):`, errorText);
          throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Réponse API géocodage:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Filtrer les résultats pour ne garder que ceux qui concernent l'Ontario
          const ontarioResults = data.filter(item => 
            item.display_name.toLowerCase().includes('ontario') || 
            item.display_name.toLowerCase().includes('canada')
          );
          
          if (ontarioResults.length > 0) {
            // Traiter les résultats
            const results: LocationResult[] = ontarioResults.slice(0, 5).map((item: any, index: number) => ({
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
            return;
          } else {
            console.log("Aucun résultat pour l'Ontario trouvé dans la réponse API");
          }
        } else {
          console.log("Aucun résultat retourné par l'API de géocodage");
        }
      } catch (error) {
        console.error("Erreur lors de la requête de géocodage:", error);
      }
      
      // En cas d'échec avec l'API, nous continuons avec la recherche locale
      fallbackToLocalSearch(address);
      
    } catch (error) {
      console.error("Erreur globale lors du géocodage de l'adresse:", error);
      alert("Erreur lors de la recherche de l'adresse.");
    }
  };
  
  // Fonction de repli pour la recherche locale
  const fallbackToLocalSearch = (address: string) => {
    console.log("Utilisation de la recherche locale pour:", address);
    
    if (fuseSearch) {
      const searchResults = fuseSearch.search(address);
      const validResults = searchResults
        .filter(result => result.score && result.score < 0.5)
        .map(result => result.item);
      
      if (validResults.length > 0) {
        console.log("Résultats de recherche locale trouvés:", validResults.length);
        setSearchResults(validResults);
        setShowResults(true);
        selectDestination(validResults[0]);
        return;
      } else {
        console.log("Aucun résultat trouvé dans la recherche locale");
      }
    } else {
      console.warn("FuseSearch n'est pas initialisé, impossible d'effectuer une recherche locale");
    }
    
    // Si aucun résultat trouvé
    alert("Aucune adresse trouvée. Veuillez essayer une autre recherche.");
  };

  // Sélectionner une destination
  const selectDestination = (location: LocationResult) => {
    setSelectedLocation(location);
    setDestination(location.name);
    setShowResults(false);
    
    // Sauvegarder la destination dans le contexte global pour persistance entre les panneaux
    setCurrentDestination({
      latitude: location.lat,
      longitude: location.lng,
      address: location.address || location.name
    });
    
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
    
    // Mettre à jour les états locaux et globaux
    setIsNavigating(false);
    setGlobalIsNavigating(false);
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
    
    // Créer un nouveau contrôle d'itinéraire avec options personnalisées
    const newRouteControl = L.Routing.control({
      waypoints,
      // Options de routage
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
      show: false, // Ne pas afficher le panneau de contrôle par défaut
      collapsible: true, // Permettre au panneau d'être réduit
      autoRoute: true, // Calculer l'itinéraire automatiquement
      // Spécifier les options du routeur OSRM avec support du français
      router: (L.Routing as any).osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving', // Mode de transport (driving, car, bike, foot, etc.)
        useHints: true
        // Note: l'option de langue n'est pas disponible dans le type
      })
    }).addTo(map);
    
    setRouteControl(newRouteControl);
    
    // Écouter les événements de routage pour obtenir les instructions
    newRouteControl.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes.length > 0) {
        const route = routes[0];
        
        // Extraire les instructions de navigation et convertir les unités si nécessaire
        const instructions = route.instructions.map((instruction: any, index: number) => {
          // S'assurer que la distance est en mètres (système métrique)
          let distance = instruction.distance;
          
          // Si la distance semble être en miles, convertir en mètres (1 mile ≈ 1609 mètres)
          if (instruction.distance < 100 && route.summary.totalDistance > 1000) {
            distance = instruction.distance * 1609;
          }
          
          return {
            // Normaliser le texte en français pour être sûr (le cas échéant)
            text: normalizeInstructionText(instruction.text),
            distance: distance,
            time: instruction.time,
            type: instruction.type,
            index
          };
        });
        
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
    // Mettre à jour l'état local et global de la navigation
    setIsNavigating(true);
    setGlobalIsNavigating(true);
    
    // Annoncer vocalement la première instruction
    if (instructions.length > 0) {
      speakInstruction(instructions[0]);
    }
  };

  // Arrêter la navigation
  const stopNavigation = () => {
    // Mettre à jour l'état local et global de la navigation
    setIsNavigating(false);
    setGlobalIsNavigating(false);
    
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

  // Normaliser le texte des instructions pour assurer l'utilisation du système métrique et de la langue française
  const normalizeInstructionText = (text: string): string => {
    // Remplacer les références en miles par des kilomètres
    let normalizedText = text
      .replace(/(\d+(\.\d+)?)\s*miles?/gi, (match, value) => {
        // Convertir miles en km (1 mile ≈ 1.60934 km)
        const kmValue = parseFloat(value) * 1.60934;
        return `${kmValue.toFixed(1)} kilomètres`;
      })
      .replace(/(\d+(\.\d+)?)\s*ft/gi, (match, value) => {
        // Convertir pieds en mètres (1 pied ≈ 0.3048 mètres)
        const mValue = parseFloat(value) * 0.3048;
        return `${Math.round(mValue)} mètres`;
      })
      .replace(/(\d+(\.\d+)?)\s*yards?/gi, (match, value) => {
        // Convertir yards en mètres (1 yard ≈ 0.9144 mètres)
        const mValue = parseFloat(value) * 0.9144;
        return `${Math.round(mValue)} mètres`;
      });
      
    // Traduire les instructions de base en français si elles sont en anglais
    normalizedText = normalizedText
      .replace(/Continue straight/gi, "Continuez tout droit")
      .replace(/Turn right/gi, "Tournez à droite")
      .replace(/Turn left/gi, "Tournez à gauche")
      .replace(/Slight right/gi, "Légère droite")
      .replace(/Slight left/gi, "Légère gauche")
      .replace(/Sharp right/gi, "Tournez fortement à droite")
      .replace(/Sharp left/gi, "Tournez fortement à gauche")
      .replace(/Keep right/gi, "Serrez à droite")
      .replace(/Keep left/gi, "Serrez à gauche")
      .replace(/Take the roundabout/gi, "Prenez le rond-point")
      .replace(/You have arrived/gi, "Vous êtes arrivé à destination")
      .replace(/Destination/gi, "Destination");
      
    return normalizedText;
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

  // Fonction pour centrer automatiquement la carte sur l'utilisateur
  const centerMapOnUser = () => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  // Démarrer le suivi continu de position
  const startPositionTracking = () => {
    if (!navigator.geolocation) {
      console.warn("La géolocalisation n'est pas supportée par ce navigateur");
      return;
    }
    
    if (watchId !== null) {
      stopPositionTracking();
    }
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,          
      maximumAge: 5000        // Réduire le cache pour des mises à jour plus fréquentes
    };
    
    try {
      console.log("Simulant une position fixe pour le développement...");
      // Position par défaut (Niagara Falls)
      const defaultLocation = { lat: 43.0716, lng: -79.1010 };
      updateUserLocation(defaultLocation.lat, defaultLocation.lng);
      
      // Simuler un ID de suivi pour maintenir la cohérence du code
      const id = 999;
      
      setWatchId(id);
      console.log("Suivi GPS démarré avec ID:", id);
    } catch (error) {
      console.error("Erreur lors du démarrage du suivi GPS:", error);
    }
  };
  
  // Arrêter le suivi de position (version simplifiée)
  const stopPositionTracking = () => {
    if (watchId !== null) {
      console.log("Nettoyage du suivi simulé, ID:", watchId);
      setWatchId(null);
    }
  };
  
  useEffect(() => {
    // Initialiser la position de l'utilisateur au chargement
    handleGeolocate();
    
    // Démarrer le suivi continu de position
    startPositionTracking();
    
    // Obtenir les voix disponibles pour la synthèse vocale
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    
    // Restaurer la navigation si elle était active précédemment
    if (globalIsNavigating && selectedLocation && userLocation) {
      // Calculer à nouveau l'itinéraire après le chargement complet du composant
      setTimeout(() => {
        console.log('Restauration de la navigation précédente...');
        calculateRoute();
      }, 1000); // Attendre que la carte soit correctement initialisée
    }
    
    // Nettoyer le suivi à la fermeture du composant
    return () => {
      stopPositionTracking();
    };
  }, [map, userLocation]);

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
        
        {/* Bouton pour centrer sur l'utilisateur */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
          <button 
            className="bg-[#2D2D2D] p-3 rounded-lg hover:bg-[#3D3D3D] transition-colors"
            onClick={centerMapOnUser}
            title="Centrer sur ma position"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f89422]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button 
            className={`p-3 rounded-lg transition-colors ${autoCenter ? 'bg-[#f89422] text-black' : 'bg-[#2D2D2D] text-white'}`}
            onClick={() => setAutoCenter(!autoCenter)}
            title={autoCenter ? "Désactiver le centrage automatique" : "Activer le centrage automatique"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>
        </div>
        
        {/* Le panneau d'information a été retiré d'ici pour être intégré dans le Footer */}
        
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
