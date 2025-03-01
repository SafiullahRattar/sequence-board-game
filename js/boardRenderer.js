import { gameState, boardLayout } from './gameState.js';
import { showNotification } from './uiController.js';

// DOM Element references
const gameBoard = document.getElementById('gameBoard');
const playerHand = document.getElementById('playerHand');
const player1Element = document.getElementById('player1');
const player2Element = document.getElementById('player2');
const sequenceCounter = document.getElementById('sequenceCounter');
const selectedCardElement = document.getElementById('selectedCard');
const gameLink = document.getElementById('gameLink');
const gameCode = document.getElementById('gameCode');
const linkBox = document.getElementById('linkBox');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');

// Create the game board
export function createGameBoard() {
  gameBoard.innerHTML = '';
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      const cardCode = boardLayout[row][col];

      if (cardCode === 'F') {
        cell.className = 'cell corner';
        cell.innerHTML = '<span>FREE</span>';
      } else if (cardCode !== 'X') {
        const value = cardCode.slice(0, -1);
        const suit = cardCode.slice(-1);
        const isRed = suit === '♥' || suit === '♦';

        const cardValue = document.createElement('span');
        cardValue.textContent = value;
        if (isRed) cardValue.classList.add('red');

        const cardSuitTop = document.createElement('span');
        cardSuitTop.textContent = suit;
        cardSuitTop.className = 'card-suit top';
        if (isRed) cardSuitTop.classList.add('red');

        const cardSuitBottom = document.createElement('span');
        cardSuitBottom.textContent = suit;
        cardSuitBottom.className = 'card-suit bottom';
        if (isRed) cardSuitBottom.classList.add('red');

        cell.appendChild(cardValue);
        cell.appendChild(cardSuitTop);
        cell.appendChild(cardSuitBottom);
      }

      gameBoard.appendChild(cell);
    }
  }
}

// Update the game board UI
export function updateGameBoard() {
  // Clear all tokens and sequence markers
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const tokenElements = cell.querySelectorAll('.token');
    tokenElements.forEach(token => token.remove());

    const sequenceElements = cell.querySelectorAll('.sequence');
    sequenceElements.forEach(seq => seq.remove());
  });

  // Make sure the sequences array exists
  if (!gameState.sequences) {
    gameState.sequences = [];
  }

  // Add tokens and sequence markers based on game state
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!gameState.board[row] || !gameState.board[row][col]) continue;

      const cellData = gameState.board[row][col];
      const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
      if (!cellElement) continue;

      // Add token if exists
      if (cellData.token) {
        const token = document.createElement('div');
        token.className = `token ${cellData.token}`;
        cellElement.appendChild(token);
      }

      // Check if this position is in any sequence
      const isInSequence = cellData.inSequence || gameState.sequences.some(seq =>
        seq.positions.some(pos => pos.row === row && pos.col === col)
      );

      // Add sequence marker if this cell is part of a sequence
      if (isInSequence) {
        const sequenceMark = document.createElement('div');
        sequenceMark.className = 'sequence';
        sequenceMark.textContent = '★';
        cellElement.appendChild(sequenceMark);
      }
    }
  }
}

// Update player info UI
export function updatePlayerInfo() {
  const playerIndex = gameState.isHost ? 0 : 1;

  // Set player names
  player1Element.textContent = gameState.isHost ?
    `${gameState.players[0].name} (You)` :
    gameState.players[0].name;

  player2Element.textContent = !gameState.isHost ?
    `${gameState.players[1].name} (You)` :
    gameState.players[1].name;

  // Update active class based on current player
  player1Element.className = gameState.currentPlayer === 0 ? 'active' : '';
  player2Element.className = gameState.currentPlayer === 1 ? 'active' : '';

  // Make sure sequence counts exist
  if (typeof gameState.players[0].sequences !== 'number') {
    gameState.players[0].sequences = 0;
  }
  if (typeof gameState.players[1].sequences !== 'number') {
    gameState.players[1].sequences = 0;
  }

  // Update sequence counter with the current player's sequences
  const mySequences = gameState.players[playerIndex].sequences;
  sequenceCounter.textContent = `${mySequences}/${gameState.sequencesToWin}`;

  // Update selected card
  if (gameState.selectedCard !== null && gameState.players[playerIndex].hand) {
    selectedCardElement.textContent = gameState.players[playerIndex].hand[gameState.selectedCard];
  } else {
    selectedCardElement.textContent = 'None';
  }

  // Handle game ID and link display
  if (gameState.gameId && gameLink.value === '') {
    const baseUrl = window.location.origin + window.location.pathname;
    const gameUrl = `${baseUrl}?game=${gameState.gameId}`;

    gameLink.value = gameUrl;
    gameCode.textContent = gameState.gameId;

    if (gameState.isHost) {
      linkBox.style.display = 'block';
    }
  }

  // Show game screen once both players have joined
  if (gameState.players[0].name && gameState.players[1].name &&
    gameState.players[0].name !== 'Player 1' && gameState.players[1].name !== 'Player 2') {
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    linkBox.style.display = 'none'; // Hide link box after player joins
  }
}

// Update player hand UI
export function updatePlayerHand() {
  const playerIndex = gameState.isHost ? 0 : 1;
  playerHand.innerHTML = '';

  if (!gameState.players[playerIndex] || !gameState.players[playerIndex].hand) {
    console.error("Player hand is missing:", gameState.players[playerIndex]);
    return;
  }

  gameState.players[playerIndex].hand.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    if (gameState.selectedCard === index) {
      cardElement.classList.add('selected');
    }

    const isRed = card.includes('♥') || card.includes('♦');

    const value = card.slice(0, -1);
    const suit = card.slice(-1);

    const cardValue = document.createElement('span');
    cardValue.textContent = value;
    if (isRed) cardValue.classList.add('red');

    const cardSuitTop = document.createElement('span');
    cardSuitTop.textContent = suit;
    cardSuitTop.className = 'card-suit top';
    if (isRed) cardSuitTop.classList.add('red');

    const cardSuitBottom = document.createElement('span');
    cardSuitBottom.textContent = suit;
    cardSuitBottom.className = 'card-suit bottom';
    if (isRed) cardSuitBottom.classList.add('red');

    cardElement.appendChild(cardValue);
    cardElement.appendChild(cardSuitTop);
    cardElement.appendChild(cardSuitBottom);

    cardElement.addEventListener('click', () => {
      if (gameState.currentPlayer === playerIndex) {
        gameState.selectedCard = index;
        updatePlayerHand();
        updatePlayerInfo();
        highlightAvailableMoves(index); // Highlight available moves
      } else {
        showNotification("It's not your turn");
      }
    });

    playerHand.appendChild(cardElement);
  });
}

// Highlight available moves for the selected card
export function highlightAvailableMoves(selectedCard) {
  import('./cardActions.js').then(module => {
    module.highlightAvailableMovesImpl(selectedCard);
  });
}

// Check for winner
export function checkForWinner() {
  const maxSequences = gameState.sequencesToWin || 2;

  // Make sure sequence counts exist
  if (typeof gameState.players[0].sequences !== 'number') {
    gameState.players[0].sequences = 0;
  }
  if (typeof gameState.players[1].sequences !== 'number') {
    gameState.players[1].sequences = 0;
  }

  const player1Sequences = gameState.players[0].sequences;
  const player2Sequences = gameState.players[1].sequences;

  if (player1Sequences >= maxSequences) {
    const message = gameState.isHost ?
      "Congratulations, you win!" :
      `${gameState.players[0].name} wins!`;
    showNotification(message);
    return gameState.players[0].name;
  } else if (player2Sequences >= maxSequences) {
    const message = !gameState.isHost ?
      "Congratulations, you win!" :
      `${gameState.players[1].name} wins!`;
    showNotification(message);
    return gameState.players[1].name;
  }

  return null;
}

