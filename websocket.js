class GameWebSocket {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.onGameState = null;
    this.onPlayerJoined = null;
    this.onPlayerMove = null;
    this.onPlayerDisconnected = null;
    this.connectionReadyCallbacks = [];
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log('Connecting to WebSocket server at:', wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Connected to server');
      // Execute any queued callbacks waiting for connection
      this.connectionReadyCallbacks.forEach(callback => callback());
      this.connectionReadyCallbacks = [];
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);

      switch (data.type) {
        case 'created':
          this.gameId = data.gameId;
          if (data.gameState) {
            data.gameState.gameId = data.gameId;  // Ensure gameId is in the state
          }
          if (this.onGameState) this.onGameState(data.gameState);
          break;
        case 'gameState':
          if (this.onGameState) this.onGameState(data.gameState);
          break;
        case 'playerJoined':
          if (this.onPlayerJoined) this.onPlayerJoined(data.gameState);
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

              // Create a version of the state appropriate for the recipient
              const stateForRecipient = JSON.parse(JSON.stringify(data.gameState));
              stateForRecipient.isHost = playerId !== 'host'; // Opposite of sender

              otherPlayer.send(JSON.stringify({
                type: 'move',
                gameState: stateForRecipient
              }));
            } else {
              console.log(`Other player not available or disconnected`);
            }
          } else {
            console.log(`Game not found: ${gameId || data.gameId}`);
          }
          break;
        case 'playerDisconnected':
          if (this.onPlayerDisconnected) this.onPlayerDisconnected();
          break;
        case 'error':
          alert(data.message);
          break;
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from server');
      alert('Connection lost. Please refresh the page.');
    };
  }

  // New method: ensures a function runs only after connection is established
  whenConnected(callback) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      callback();
    } else {
      this.connectionReadyCallbacks.push(callback);
    }
  }

  createGame(gameState) {
    const sendCreateGame = () => {
      console.log('Creating game with state:', gameState);
      this.socket.send(JSON.stringify({
        type: 'create',
        gameState: gameState
      }));
    };

    this.whenConnected(sendCreateGame);
  }

  joinGame(gameId, playerName) {
    const sendJoinGame = () => {
      this.gameId = gameId;
      console.log('Joining game:', gameId, 'as', playerName);
      this.socket.send(JSON.stringify({
        type: 'join',
        gameId: gameId,
        playerName: playerName
      }));
    };

    this.whenConnected(sendJoinGame);
  }

  sendMove(gameState) {
    const sendMoveAction = () => {
      // Ensure gameState always includes the gameId
      if (this.gameId && !gameState.gameId) {
        gameState.gameId = this.gameId;
      }

      console.log('Sending move:', gameState);
      this.socket.send(JSON.stringify({
        type: 'move',
        gameId: this.gameId,
        gameState: gameState
      }));
    };

    this.whenConnected(sendMoveAction);
  }
}
