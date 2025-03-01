class GameWebSocket {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectCallbacks = [];
    this.gameId = null;
  }

  connect() {
    // Determine WebSocket URL (use secure connection if on HTTPS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port;
    const wsUrl = `${protocol}//${host}:${port}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.connected = true;
      this.connectCallbacks.forEach(callback => callback());
      this.connectCallbacks = [];
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.connected = false;
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message from server:', message);

        switch (message.type) {
          case 'created':
            this.gameId = message.gameId;
            if (this.onGameCreated) {
              this.onGameCreated(message);
            }
            break;

          case 'gameState':
            if (this.onGameState) {
              this.onGameState(message.gameState);
            }
            break;

          case 'playerJoined':
            if (this.onPlayerJoined) {
              this.onPlayerJoined(message.gameState);
            }
            break;

          case 'move':
            if (this.onPlayerMove) {
              this.onPlayerMove(message.gameState);
            }
            break;

          case 'playerDisconnected':
            if (this.onPlayerDisconnected) {
              this.onPlayerDisconnected();
            }
            break;

          case 'error':
            console.error('Error from server:', message.message);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
  }

  whenConnected(callback) {
    if (this.connected) {
      callback();
    } else {
      this.connectCallbacks.push(callback);
    }
  }

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

  sendMove(gameState) {
    if (!this.connected) {
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
}
