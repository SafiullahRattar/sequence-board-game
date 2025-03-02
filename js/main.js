import { initGameState } from './gameState.js';
import { setupEventListeners } from './eventHandlers.js';
import { createGameBoard } from './boardRenderer.js';
import { showJoinOption } from './gameSetup.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);

// Initialize the game
function initGame() {
  // Check if joining a game via URL
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get('game');
  if (gameCode) {
    // This is player 2 joining
    const usernameInput = document.getElementById('username');
    if (usernameInput && usernameInput.value === 'Player 1') {
      usernameInput.value = 'Player 2';
    }
  }
  // Initialize global game state
  initGameState();

  // Create the game board UI
  createGameBoard();

  // Set up all event listeners
  setupEventListeners();

  // Check for join option in URL parameters
  showJoinOption();
}
