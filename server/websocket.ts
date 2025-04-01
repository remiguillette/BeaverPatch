import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

let wss: WebSocketServer;

interface ClientConnection {
  ws: WebSocket;
  lastPing: number;
}

const clients: ClientConnection[] = [];

// Track connection status
const PING_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

function heartbeat(this: WebSocket) {
  const client = clients.find(c => c.ws === this);
  if (client) {
    client.lastPing = Date.now();
  }
}

export function setupWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Add client to our list
    const client: ClientConnection = {
      ws,
      lastPing: Date.now()
    };
    clients.push(client);

    // Send initial weather data
    sendWeatherUpdate(ws);

    // Setup event handlers
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('Error processing message:', error);
        sendErrorMessage(ws, 'Invalid message format');
      }
    });

    ws.on('pong', heartbeat);
    
    ws.on('close', () => {
      console.log('Client disconnected');
      const index = clients.findIndex(c => c.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
    
    // Send initial connection status
    sendConnectionStatus(ws, true);
  });

  // Ping clients periodically and check for timeouts
  setInterval(() => {
    const now = Date.now();
    
    // Ping all clients
    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    });
    
    // Check for timeouts
    clients.forEach((client, index) => {
      if (now - client.lastPing > CONNECTION_TIMEOUT) {
        console.log('Client timed out');
        if (client.ws.readyState === WebSocket.OPEN) {
          sendConnectionStatus(client.ws, false);
          client.ws.terminate();
        }
        clients.splice(index, 1);
      }
    });
  }, PING_INTERVAL);

  return wss;
}

async function sendWeatherUpdate(ws: WebSocket) {
  try {
    const toronto = await storage.getWeather('Toronto, ON');
    if (toronto && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'weather',
        data: toronto
      }));
    }
  } catch (error) {
    console.error('Error sending weather update:', error);
  }
}

function sendConnectionStatus(ws: WebSocket, connected: boolean) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'connectionStatus',
      connected,
      timestamp: new Date().toISOString()
    }));
  }
}

function sendErrorMessage(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      message
    }));
  }
}

function handleClientMessage(ws: WebSocket, data: any) {
  switch (data.type) {
    case 'ping':
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
      break;
      
    case 'requestWeather':
      sendWeatherUpdate(ws);
      break;
      
    default:
      console.log('Unknown message type:', data.type);
      sendErrorMessage(ws, `Unknown message type: ${data.type}`);
  }
}

export function broadcastToAll(message: any) {
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}
