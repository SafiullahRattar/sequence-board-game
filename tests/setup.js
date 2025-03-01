// Set up DOM elements that the game code expects
document.body.innerHTML = `
  <div id="gameBoard"></div>
  <div id="playerHand"></div>
  <div id="player1"></div>
  <div id="player2"></div>
  <div id="currentPlayer"></div>
  <div id="gameId"></div>
`;

// Mock WebSocket since we're in Node environment
global.WebSocket = class MockWebSocket {
  constructor() {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    });
  }
  send() {}
  close() {}
};

// Simple mock functions
global.alert = () => {};
console.log = () => {};
console.error = () => {};