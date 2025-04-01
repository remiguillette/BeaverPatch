import { useState, useEffect } from 'react';
import { ConnectionStatus, WeatherData } from './types';

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

type MessageListener = (event: MessageEvent) => void;
const messageListeners: MessageListener[] = [];

type StatusChangeListener = (status: ConnectionStatus) => void;
const statusChangeListeners: StatusChangeListener[] = [];

// Weather data listeners
type WeatherUpdateListener = (data: WeatherData) => void;
const weatherUpdateListeners: WeatherUpdateListener[] = [];

let currentStatus: ConnectionStatus = 'disconnected';

// Initialize the WebSocket connection
export function initializeSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return; // Already connected or connecting
  }
  
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      updateStatus('connected');
      
      // Send a ping to the server
      sendMessage({ type: 'ping' });
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle specific message types
        if (data.type === 'connectionStatus') {
          updateStatus(data.connected ? 'connected' : 'disconnected');
        } else if (data.type === 'weather') {
          handleWeatherUpdate(data.data);
        }
        
        // Notify all message listeners
        messageListeners.forEach(listener => listener(event));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      socket = null;
      updateStatus('disconnected');
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        updateStatus('reconnecting');
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          initializeSocket();
        }, RECONNECT_DELAY);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket?.close();
    };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    updateStatus('disconnected');
  }
}

// Close the WebSocket connection
export function closeSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (socket) {
    socket.close();
    socket = null;
  }
}

// Send a message through the WebSocket
export function sendMessage(message: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Add a message listener
export function addMessageListener(listener: MessageListener) {
  messageListeners.push(listener);
  return () => {
    const index = messageListeners.indexOf(listener);
    if (index !== -1) {
      messageListeners.splice(index, 1);
    }
  };
}

// Add a status change listener
export function addStatusChangeListener(listener: StatusChangeListener) {
  statusChangeListeners.push(listener);
  // Call immediately with current status
  listener(currentStatus);
  
  return () => {
    const index = statusChangeListeners.indexOf(listener);
    if (index !== -1) {
      statusChangeListeners.splice(index, 1);
    }
  };
}

// Add a weather update listener
export function addWeatherUpdateListener(listener: WeatherUpdateListener) {
  weatherUpdateListeners.push(listener);
  return () => {
    const index = weatherUpdateListeners.indexOf(listener);
    if (index !== -1) {
      weatherUpdateListeners.splice(index, 1);
    }
  };
}

// Request weather update
export function requestWeatherUpdate() {
  sendMessage({ type: 'requestWeather' });
}

// Update connection status and notify listeners
function updateStatus(status: ConnectionStatus) {
  currentStatus = status;
  statusChangeListeners.forEach(listener => listener(status));
}

// Handle weather updates
function handleWeatherUpdate(data: WeatherData) {
  weatherUpdateListeners.forEach(listener => listener(data));
}

// React hook for connection status
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(currentStatus);
  
  useEffect(() => {
    return addStatusChangeListener(setStatus);
  }, []);
  
  return status;
}

// React hook for weather data
export function useWeatherData(): WeatherData | undefined {
  const [weather, setWeather] = useState<WeatherData | undefined>(undefined);
  
  useEffect(() => {
    const removeListener = addWeatherUpdateListener(setWeather);
    
    // Request current weather data
    requestWeatherUpdate();
    
    return removeListener;
  }, []);
  
  return weather;
}

// Initialize socket on import
initializeSocket();

// Ensure socket is closed on page unload
window.addEventListener('beforeunload', closeSocket);
