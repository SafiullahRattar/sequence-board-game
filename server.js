import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Log WebSocket server status
console.log('WebSocket server created');

// Add error handler for WebSocket server
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Log when the WebSocket server is ready
wss.on('listening', () => {
  console.log('WebSocket server is ready');
});

// Store active games
const games = new Map();

// Serve static files from current directory
app.use(express.static(__dirname));

// Add route for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  let gameId = '';
  let playerId = '';

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);

      switch (data.type) {
        case 'create':
          // Generate a unique game ID
          gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
          playerId = 'host';

          games.set(gameId, {
            host: ws,
            hostState: data.gameState,
            gameState: data.gameState
          });

          console.log(`Game created: ${gameId}`);

          ws.send(JSON.stringify({
            type: 'created',
            gameId: gameId,
            gameState: data.gameState
          }));
          break;

        case 'join':
          gameId = data.gameId;
          playerId = 'guest';
          const game = games.get(gameId);

          if (game) {
            game.guest = ws;

            // Create a proper game state for the guest
            const guestState = JSON.parse(JSON.stringify(game.gameState)); // Deep clone

            // Set isHost to false for the guest
            guestState.isHost = false;

            // Make sure the gameId is set
            guestState.gameId = gameId;
            
            // Deal cards to the guest player (7 cards)
            const guestHand = [];
            for (let i = 0; i < 7; i++) {
                if (game.gameState.deck.length > 0) {
                    guestHand.push(game.gameState.deck.pop());
                }
            }
            guestState.players[1].hand = guestHand;
            game.gameState.players[1].hand = guestHand;

            // Update player names if provided
            if (data.playerName) {
              guestState.players[1].name = data.playerName;
              game.gameState.players[1].name = data.playerName;
            }

            // Store guest state
            game.guestState = guestState;

            console.log(`Player joined game: ${gameId}`);

            // Send complete game state to joining player
            ws.send(JSON.stringify({
              type: 'gameState',
              gameState: guestState
            }));

            // Notify host with updated game state
            game.host.send(JSON.stringify({
              type: 'playerJoined',
              gameState: game.gameState
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game not found'
            }));
          }
          break;

        case 'move':
          const currentGame = games.get(gameId || data.gameId);
          if (currentGame) {
            // Update game state
            currentGame.gameState = data.gameState;

            // Send move to other player
            const otherPlayer = playerId === 'host' ? currentGame.guest : currentGame.host;
            if (otherPlayer && otherPlayer.readyState === WebSocket.OPEN) {
              console.log(`Sending move to ${playerId === 'host' ? 'guest' : 'host'}`);
              otherPlayer.send(JSON.stringify({
                type: 'move',
                gameState: data.gameState
              }));
            } else {
              console.log(`Other player not available or disconnected`);
            }
          } else {
            console.log(`Game not found: ${gameId || data.gameId}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    if (gameId && games.has(gameId)) {
      const game = games.get(gameId);
      // Notify other player about disconnection
      const otherPlayer = playerId === 'host' ? game.guest : game.host;

      if (otherPlayer && otherPlayer.readyState === WebSocket.OPEN) {
        console.log(`Notifying ${playerId === 'host' ? 'guest' : 'host'} about disconnection`);
        otherPlayer.send(JSON.stringify({
          type: 'playerDisconnected'
        }));
      }

      // Remove game if host disconnects or both players are gone
      if (playerId === 'host' ||
        (game.host && game.host.readyState !== WebSocket.OPEN &&
          game.guest && game.guest.readyState !== WebSocket.OPEN)) {
        console.log(`Removing game: ${gameId}`);
        games.delete(gameId);
      }
    }
  });
});

// Start server
const port = process.env.PORT || 3000;
console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log('Server successfully started');
});

// Error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
