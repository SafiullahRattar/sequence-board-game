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
      console.log('Raw message received:', message.toString());
      const data = JSON.parse(message);
      console.log('Parsed message:', data);

      switch (data.type) {
        case 'create':
          // Generate a unique game ID
          gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
          playerId = 'host';
          
          console.log('Creating game with player name:', data.playerName);
          
          // Create a fresh deck and initialize the board
          const deck = [];
          // Add regular cards (2 of each)
          for (let i = 0; i < 2; i++) {
            for (const suit of ['♥', '♦', '♠', '♣']) {
              for (const value of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) {
                deck.push(value + suit);
              }
            }
          }
          // Shuffle deck
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }

          // Deal initial hand to host
          const hostHand = [];
          const isDev = data.playerName === 'dev';
          
          if (isDev) {
            // Give specific cards for testing
            hostHand.push('10♠', 'Q♠', 'K♠', 'A♠');
            console.log('Dev mode activated for host');
            // Clear deck since we're in dev mode
            deck.length = 0;
          } else {
            // Normal dealing
            for (let i = 0; i < 7; i++) {
              if (deck.length > 0) {
                hostHand.push(deck.pop());
              }
            }
          }

          // Initialize board
          const board = [];
          const boardLayout = [
            ['F', '10♠', 'Q♠', 'K♠', 'A♠', '2♦', '3♦', '4♦', '5♦', 'F'],
            ['9♠', '10♥', '9♥', '8♥', '7♥', '6♥', '5♥', '4♥', '3♥', '6♦'],
            ['8♠', 'Q♥', '7♦', '8♦', '9♦', '10♦', 'Q♦', 'K♦', '2♥', '7♦'],
            ['7♠', 'K♥', '6♦', '2♣', 'A♥', 'K♥', 'Q♥', 'A♦', '2♠', '8♦'],
            ['6♠', 'A♥', '5♦', '3♣', '4♥', '3♥', '10♥', 'A♣', '3♠', '9♦'],
            ['5♠', '2♣', '4♦', '4♣', '5♥', '2♥', '9♥', 'K♣', '4♠', '10♦'],
            ['4♠', '3♣', '3♦', '5♣', '6♥', '7♥', '8♥', 'Q♣', '5♠', 'Q♦'],
            ['3♠', '4♣', '2♦', '6♣', '7♣', '8♣', '9♣', '10♣', '6♠', 'K♦'],
            ['2♠', '5♣', 'A♠', 'K♠', 'Q♠', '10♠', '9♠', '8♠', '7♠', 'A♦'],
            ['F', '6♣', '7♣', '8♣', '9♣', '10♣', 'Q♣', 'K♣', 'A♣', 'F']
          ];

          for (let row = 0; row < 10; row++) {
            board[row] = [];
            for (let col = 0; col < 10; col++) {
              const cardCode = boardLayout[row][col];
              if (cardCode === 'F') {
                board[row][col] = { type: 'free', token: null };
              } else {
                board[row][col] = { type: 'card', code: cardCode, token: null };
              }
            }
          }

          const initialGameState = {
            board: board,
            deck: deck,
            players: [
              { name: data.playerName || 'Player 1', hand: hostHand, color: 'blue', sequences: 0 },
              { name: '', hand: [], color: 'green', sequences: 0 }
            ],
            currentPlayer: 0,
            sequencesToWin: 2,
            selectedCard: null,
            sequences: [],
            gameId: gameId,
            isHost: true
          };

          games.set(gameId, {
            host: ws,
            hostState: initialGameState,
            gameState: initialGameState
          });

          console.log(`Game created: ${gameId}`);

          ws.send(JSON.stringify({
            type: 'created',
            gameId: gameId,
            gameState: initialGameState
          }));
          break;

        case 'join':
          gameId = data.gameId;
          playerId = 'guest';
          console.log('Join request received for game:', gameId);
          const game = games.get(gameId);

          if (game) {
            console.log('Game found, adding guest player');
            game.guest = ws;

            // Ensure game state exists
            if (!game.gameState) {
              game.gameState = {
                board: [],
                deck: [],
                players: [
                  { name: 'Player 1', hand: [], color: 'blue', sequences: 0 },
                  { name: data.playerName || 'Player 2', hand: [], color: 'green', sequences: 0 }
                ],
                currentPlayer: 0,
                sequencesToWin: 2,
                selectedCard: null,
                sequences: [],
                gameId: gameId,
                isHost: true
              };
            }

            // Create a proper game state for the guest
            console.log('Original game state:', game.gameState);
            const guestState = JSON.parse(JSON.stringify(game.gameState));

            // Set isHost to false for the guest
            guestState.isHost = false;

            // Make sure the gameId is set
            guestState.gameId = gameId;
            
            // Ensure game state has required properties
            if (!guestState.players) {
                guestState.players = [{}, {}];
            }
            if (!guestState.players[1]) {
                guestState.players[1] = {};
            }
            if (!game.gameState.players) {
                game.gameState.players = [{}, {}];
            }
            if (!game.gameState.players[1]) {
                game.gameState.players[1] = {};
            }
            if (!game.gameState.deck) {
                game.gameState.deck = [];
            }

            // Ensure game state has a deck
            if (!game.gameState.deck) {
              console.error('No deck found in game state');
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Game initialization error'
              }));
              return;
            }

            // Deal cards to the guest player
            const guestHand = [];
            
            // If host was in dev mode, give guest one one-eyed jack
            if (game.gameState.players[0].name === 'dev') {
                guestHand.push('J♠'); // One-eyed jack
                console.log('Dev mode: Gave guest one-eyed jack');
            } else {
                // Normal dealing
                for (let i = 0; i < 7; i++) {
                    if (game.gameState.deck.length > 0) {
                        guestHand.push(game.gameState.deck.pop());
                    }
                }
            }

            // Update both states with the guest's hand
            guestState.players[1].hand = guestHand;
            game.gameState.players[1].hand = guestHand;

            console.log('Dealt hand to guest:', guestHand);

            // Set default name for player 2 or use provided name
            const playerName = data.playerName || 'Player 2';
            guestState.players[1].name = playerName;
            game.gameState.players[1].name = playerName;

            // Store guest state
            game.guestState = guestState;

            console.log(`Player joined game: ${gameId} as ${playerName}`);

            // Send complete game state to joining player
            if (ws.readyState === WebSocket.OPEN) {
              const response = {
                type: 'gameState',
                gameState: guestState || {}
              };
              console.log('Sending to guest:', response);
              ws.send(JSON.stringify(response));
            }

            // Notify host with updated game state
            if (game.host && game.host.readyState === WebSocket.OPEN) {
              game.host.send(JSON.stringify({
                type: 'playerJoined',
                gameState: game.gameState
              }));
            }
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
      // Try to send error back to client
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Server error occurred. Please try again.'
          }));
        }
      } catch (e) {
        console.error('Error sending error message to client:', e);
      }
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
