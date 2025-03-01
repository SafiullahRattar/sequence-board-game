import { gameState, updateGameFromServer, initializeBoard, createAndShuffleDeck, dealCards } from './gameState.js';
import { updateGameBoard, updatePlayerHand, updatePlayerInfo } from './boardRenderer.js';
import { handleCellClick, handleCardPlay } from './cardActions.js';
import { sendGameUpdate, setupWebSocket, sendGameAction } from './webSocketHandler.js';
import { showNotification } from './uiController.js';

// DOM Element references
const createGameButton = document.getElementById('createGame');
const copyLinkButton = document.getElementById('copyLink');
const gameLink = document.getElementById('gameLink');
const showRulesButton = document.getElementById('showRules');
const rulesModal = document.getElementById('rulesModal');
const closeModalButton = document.querySelector('.close');
const joinGameButton = document.getElementById('joinGame');
const joinForm = document.getElementById('joinForm');
const username = document.getElementById('username');
const sequences = document.getElementById('sequences');
const firstPlayer = document.getElementById('firstPlayer');

// Set up all event listeners
export function setupEventListeners() {
  // Create game button
  createGameButton.addEventListener('click', handleCreateGame);

  // Copy link button
  copyLinkButton.addEventListener('click', () => {
    gameLink.select();
    document.execCommand('copy');
    showNotification('Game link copied to clipboard!');
  });

  // Rules modal
  showRulesButton.addEventListener('click', () => {
    rulesModal.style.display = 'block';
  });

  closeModalButton.addEventListener('click', () => {
    rulesModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
      rulesModal.style.display = 'none';
    }
  });

  // Join game button
  joinGameButton.addEventListener('click', handleJoinGame);

  // Cell click handling
  document.getElementById('gameBoard').addEventListener('click', handleCellClick);
}

// Handle creating a new game
function handleCreateGame() {
  if (!username.value.trim()) {
    showNotification('Please enter a username');
    return;
  }

  const playerName = username.value.trim();
  const sequencesToWin = parseInt(sequences.value);
  const startingPlayer = firstPlayer.value;

  // Initialize game
  gameState.board = initializeBoard();
  gameState.deck = createAndShuffleDeck();
  gameState.players[0].name = playerName;
  gameState.players[1].name = 'Player 2'; // Placeholder until guest joins
  gameState.sequencesToWin = sequencesToWin;
  gameState.currentPlayer = startingPlayer === 'host' ? 0 : 1;
  gameState.isHost = true;

  // Deal cards
  dealCards();

  // Set up WebSocket connection
  setupWebSocket().then(() => {
    // Send initial game state
    sendGameUpdate(gameState);

    // Show join option
    joinForm.style.display = 'block';

    // Update UI
    updateGameBoard();
    updatePlayerHand();
    updatePlayerInfo();
  }).catch(err => {
    console.error('Error setting up WebSocket:', err);
    showNotification('Error creating game. Please try again.');
  });
}

// Handle joining an existing game
function handleJoinGame() {
  const joinCode = document.getElementById('joinCode').value;

  if (!username.value.trim()) {
    showNotification('Please enter a username');
    return;
  }

  if (!joinCode.trim()) {
    showNotification('Please enter a game code');
    return;
  }

  const playerName = username.value.trim();

  // Initialize client as a guest
  gameState.isHost = false;
  gameState.gameId = joinCode.trim();

  // Set up WebSocket connection
  setupWebSocket().then(() => {
    // Send join request
    sendGameAction('join', {
      gameId: joinCode.trim(),
      playerName: playerName
    });
  }).catch(err => {
    console.error('Error setting up WebSocket:', err);
    showNotification('Error joining game. Please try again.');
  });
}

// Export any other handlers that need to be called from other modules
export { updateGameFromServer };
