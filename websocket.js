class GameWebSocket {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.onGameState = null;
        this.onPlayerJoined = null;
        this.onPlayerMove = null;
        this.onPlayerDisconnected = null;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('Connecting to WebSocket server at:', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Connected to server');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            switch(data.type) {
                case 'created':
                    this.gameId = data.gameId;
                    if (this.onGameState) this.onGameState(data.gameState);
                    break;
                case 'gameState':
                    if (this.onGameState) this.onGameState(data.gameState);
                    break;
                case 'playerJoined':
                    if (this.onPlayerJoined) this.onPlayerJoined(data.gameState);
                    break;
                case 'move':
                    if (this.onPlayerMove) this.onPlayerMove(data.gameState);
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

    createGame(gameState) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('Socket not connected');
            return;
        }
        
        console.log('Creating game with state:', gameState);
        this.socket.send(JSON.stringify({
            type: 'create',
            gameState: gameState
        }));
    }

    joinGame(gameId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('Socket not connected');
            return;
        }
        
        this.gameId = gameId;
        console.log('Joining game:', gameId);
        this.socket.send(JSON.stringify({
            type: 'join',
            gameId: gameId
        }));
    }

    sendMove(gameState) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('Socket not connected');
            return;
        }
        
        console.log('Sending move:', gameState);
        this.socket.send(JSON.stringify({
            type: 'move',
            gameId: this.gameId,
            gameState: gameState
        }));
    }
}