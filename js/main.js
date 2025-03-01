import { initGameState } from './gameState.js';
import { setupEventListeners } from './eventHandlers.js';
import { createGameBoard } from './boardRenderer.js';
import { showJoinOption } from './gameSetup.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);

// Initialize the game
function initGame() {
  // Initialize global game state
  initGameState();

  // Create the game board UI
  createGameBoard();

  // Set up all event listeners
  setupEventListeners();

  // Check for join option in URL parameters
  showJoinOption();
}
