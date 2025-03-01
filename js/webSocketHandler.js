import { updateGameFromServer } from './gameState.js';
import { updateGameBoard, updatePlayerHand, updatePlayerInfo, checkForWinner } from './boardRenderer.js';
import { showNotification } from './uiController.js';

// WebSocket handler singleton
class GameWebSocketHandler {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectCallbacks = [];
    this.gameId = null;
  }

  // Set up WebSocket connection
  setupWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // Determine WebSocket URL (use secure connection if on HTTPS)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
        this.socket = new WebSocket(`${protocol}//${host}`);

        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.connected = true;
          this.connectCallbacks.forEach(callback => callback());
          this.connectCallbacks = [];
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleWebSocketMessage(event.data);
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          this.connected = false;
          showNotification('Connection to server lost');
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // Wait for connection before executing callback
  whenConnected(callback) {
    if (this.connected) {
      callback();
    } else {
      this.connectCallbacks.push(callback);
    }
  }

  // Handle incoming WebSocket messages
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'gameState':
          updateGameFromServer(message.data || message.gameState);
          updateGameBoard();
          updatePlayerHand();
          updatePlayerInfo();
          checkForWinner();
          break;

        case 'created':
        case 'gameCreated':
          showNotification('Game created successfully! Share the code with a friend.');
          if (message.gameId) {
            this.gameId = message.gameId;
          } else if (message.data && message.data.gameId) {
            this.gameId = message.data.gameId;
          } else {
            console.error('No game ID received');
            return;
          }

          updateGameFromServer({
            ...(message.data || message.gameState || {}),
            gameId: this.gameId
          });
          updatePlayerInfo();
          break;

        case 'playerJoined':
          showNotification(`${message.data?.playerName || 'A player'} has joined the game!`);
          if (message.gameState) {
            updateGameFromServer(message.gameState);
            updateGameBoard();
            updatePlayerHand();
            updatePlayerInfo();
          }
          break;

        case 'playerDisconnected':
          showNotification('The other player has disconnected.');
          break;

        case 'error':
          showNotification(`Error: ${message.message || message.data?.message}`);
          break;

        case 'move':
          // Handle move messages from original implementation
          if (message.gameState) {
            updateGameFromServer(message.gameState);
            updateGameBoard();
            updatePlayerHand();
            updatePlayerInfo();
            checkForWinner();
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }

  // Create a new game
  createGame(gameState) {
    if (!this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.send(JSON.stringify({
      type: 'create',
      gameState: gameState
    }));
  }

  // Join an existing game
  joinGame(gameId, playerName) {
    if (!this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.gameId = gameId;
    this.socket.send(JSON.stringify({
      type: 'join',
      gameId: gameId,
      playerName: playerName
    }));
  }

  // Send game state update
  sendGameUpdate(gameState) {
    if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Make sure gameId is set in the state
    if (this.gameId) {
      gameState.gameId = this.gameId;
    }

    this.socket.send(JSON.stringify({
      type: 'move',
      gameId: this.gameId,
      gameState: gameState
    }));
  }

  // Send game action (for compatibility with new implementation)
  sendGameAction(action, data) {
    if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (action === 'join') {
      // Handle join action specially
      this.joinGame(data.gameId, data.playerName);
      return;
    }

    const message = {
      type: action,
      data: data
    };

    this.socket.send(JSON.stringify(message));
  }
}

// Create singleton instance
const wsHandler = new GameWebSocketHandler();

// Export functions that match the interface expected by other modules
export function setupWebSocket() {
  return wsHandler.setupWebSocket();
}

export function sendGameUpdate(gameState) {
  return wsHandler.sendGameUpdate(gameState);
}

export function sendGameAction(action, data) {
  return wsHandler.sendGameAction(action, data);
}

export function whenConnected(callback) {
  return wsHandler.whenConnected(callback);
}

