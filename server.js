import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

// Dev mode configuration
const DEV_MODE = {
  enabled: true,
  hostHand: ['10♠', 'Q♠', 'K♠', 'A♠', '2♥', '3♥', '4♥'],
  guestHand: ['J♠', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣']
};

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

          // Initialize game based on mode
          const isDev = data.playerName === 'dev';
          let deck = [];
          let hostHand = [];

          console.log('Initializing new game');

          if (isDev) {
            console.log('DEV MODE ACTIVATED');
            // Set exact cards for testing
            hostHand = ['10♠', 'Q♠', 'K♠', 'A♠', '2♥', '3♥', '4♥'];
            deck = ['J♠', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣'];
            console.log('Dev mode host hand:', hostHand);
            console.log('Dev mode deck for player 2:', deck);
          } else {
            // Create regular deck
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
            // Deal normal hand to host (exactly 7 cards)
            hostHand = [];  // Reset hand
            for (let i = 0; i < 7 && deck.length > 0; i++) {
              hostHand.push(deck.pop());
            }
            console.log('Dealt normal hand to host:', hostHand);
          }

          if (isDev) {
            console.log('DEV MODE ACTIVATED');
            // Set exact cards for testing
            hostHand = ['10♠', 'Q♠', 'K♠', 'A♠', '2♥', '3♥', '4♥'];
            deck = ['J♠', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣'];
            console.log('Dev mode host hand:', hostHand);
            console.log('Dev mode deck for player 2:', deck);
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

          // Create fresh copy of the hand to prevent reference issues
          const initialHostHand = isDev ? ['10♠', 'Q♠', 'K♠', 'A♠', '2♥', '3♥', '4♥'] : [...hostHand];
          console.log('Initial host hand:', initialHostHand);

          const initialGameState = {
            board: board,
            deck: [...deck],  // Create fresh copy of deck
            players: [
              { name: data.playerName || 'Player 1', hand: initialHostHand, color: 'blue', sequences: 0 },
              { name: '', hand: [], color: 'green', sequences: 0 }
            ],
            currentPlayer: 0,
            sequencesToWin: 2,
            selectedCard: null,
            sequences: [],
            gameId: gameId,
            isHost: true,
            isDev: isDev  // Add flag to track dev mode
          };

          if (isDev) {
            console.log('Initial game state in dev mode:');
            console.log('Host hand:', initialGameState.players[0].hand);
            console.log('Deck:', initialGameState.deck);
          }

          games.set(gameId, {
            host: ws,
            hostState: initialGameState,
            gameState: initialGameState
          });

          console.log(`Game created: ${gameId}`);
          if (isDev) {
            console.log('Sending dev mode initial state:');
            console.log('Host hand:', initialGameState.players[0].hand);
            console.log('Deck:', initialGameState.deck);
          }

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
            
            // Preserve dev mode hands if needed
            if (DEV_MODE.enabled && game.gameState.players[0].name === 'dev') {
                console.log('Preserving dev mode hands');
                game.gameState.players[0].hand = [...DEV_MODE.hostHand];
                guestState.players[0].hand = [...DEV_MODE.hostHand];
            }

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

            // Deal cards to the guest player (exactly 7 cards)
            const guestHand = [];

            // Check if this is a dev mode game
            if (game.gameState.isDev) {
              console.log('Dev mode: Dealing to guest');
              console.log('Dev mode detected for guest');
              guestHand.push('J♠');  // One-eyed jack
              guestHand.push('2♣', '3♣', '4♣', '5♣', '6♣', '7♣');  // Fill rest with fixed cards
              // Clear the deck to prevent additional dealing
              game.gameState.deck = [];
              console.log('Dev mode guest hand:', guestHand);
            } else {
              // Normal dealing
              for (let i = 0; i < 7; i++) {
                if (game.gameState.deck.length > 0) {
                  guestHand.push(game.gameState.deck.pop());
                }
              }
              console.log('Normal mode guest hand:', guestHand);
            }

            // Ensure hand size is exactly 7 cards
            if (guestHand.length !== 7) {
              console.error('Invalid guest hand size:', guestHand.length);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error initializing player hand'
              }));
              return;
            }

            // Update both states with the guest's hand
            guestState.players[1].hand = [...guestHand];  // Create fresh copy
            game.gameState.players[1].hand = [...guestHand];  // Create fresh copy

            console.log('Final guest hand size:', guestHand.length);

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
              // Preserve host's hand in dev mode
              if (DEV_MODE.enabled && game.gameState.players[0].name === 'dev') {
                console.log('Preserving dev mode host hand:', DEV_MODE.hostHand);
                game.gameState.players[0].hand = [...DEV_MODE.hostHand];
              }
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
            // Preserve dev mode hands before updating state
            const oldState = currentGame.gameState;
            if (DEV_MODE.enabled && oldState.players[0].name === 'dev') {
                console.log('Preserving dev hands during move');
                data.gameState.players[0].hand = [...DEV_MODE.hostHand];
                if (data.gameState.players[1].hand.length === 0) {
                    data.gameState.players[1].hand = [...DEV_MODE.guestHand];
                }
            }
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
