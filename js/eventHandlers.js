import { gameState, updateGameFromServer, initializeBoard, createAndShuffleDeck, dealCards } from './gameState.js';
import { updateGameBoard, updatePlayerHand, updatePlayerInfo } from './boardRenderer.js';
import { handleCellClick, handleCardPlay } from './cardAction.js';
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
  
  if (playerName === 'dev') {
    console.log('Dev mode activated');
    // Create a specific deck for testing
    gameState.deck = ['10♠', 'Q♠', 'K♠', 'A♠'];
  } else {
    gameState.deck = createAndShuffleDeck();
  }
  gameState.players[0].name = playerName;
  gameState.players[1].name = 'Player 2'; // Placeholder until guest joins
  gameState.sequencesToWin = sequencesToWin;
  gameState.currentPlayer = startingPlayer === 'host' ? 0 : 1;
  gameState.isHost = true;

  // Deal cards
  dealCards();

  // Set up WebSocket connection
  setupWebSocket().then(() => {
    // Hide create game button and show loading state
    createGameButton.disabled = true;
    
    // Send create game request
    sendGameAction('create', {
      gameState: gameState
    });

    // Update UI
    updateGameBoard();
    updatePlayerHand();
    updatePlayerInfo();

    // Show game screen
    document.getElementById('gameScreen').style.display = 'block';
  }).catch(err => {
    console.error('Error setting up WebSocket:', err);
    showNotification('Error creating game. Please try again.');
  });
}

// Handle joining an existing game
function handleJoinGame() {
  const joinCode = document.getElementById('joinCode').value;
  
  // Always set name to Player 2 unless explicitly changed by user
  const defaultName = 'Player 2';
  if (!username.value.trim() || username.value.trim() === 'Player 1') {
    username.value = defaultName;
  }
  
  // Always set name to Player 2 if joining, unless explicitly changed
  if (username.value.trim() === 'Player 1' || !username.value.trim()) {
    username.value = 'Player 2';
  }

  if (!joinCode.trim()) {
    showNotification('Please enter a game code');
    return;
  }

  const playerName = username.value.trim();

  console.log('Joining game with code:', joinCode.trim());
  console.log('Player name:', playerName);

  // Initialize client as a guest
  gameState.isHost = false;
  gameState.gameId = joinCode.trim();
  gameState.players[1].name = playerName;  // Set player 2's name

  // Set up WebSocket connection
  setupWebSocket().then(() => {
    console.log('WebSocket connected, sending join request');
    // Send join request
    sendGameAction('join', {
      gameId: joinCode.trim(),
      playerName: playerName
    });

    // Hide join form
    document.getElementById('joinForm').style.display = 'none';
    showNotification('Joining game...');
  }).catch(err => {
    console.error('Error setting up WebSocket:', err);
    showNotification('Error joining game. Please try again.');
  });
}

// Export any other handlers that need to be called from other modules
export { updateGameFromServer };
