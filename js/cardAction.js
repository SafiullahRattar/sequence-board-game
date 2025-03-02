import { gameState, SPECIAL_JACKS, boardLayout } from './gameState.js';
import { updateGameBoard, updatePlayerHand, updatePlayerInfo } from './boardRenderer.js';
// Note: Be careful of circular dependencies between boardRenderer.js and cardAction.js
import { sendGameUpdate } from './webSocketHandler.js';
import { showNotification } from './uiController.js';

// Handle card play logic
export function handleCardPlay(card, row, col) {
  const playerIndex = gameState.isHost ? 0 : 1;

  // Check if it's the player's turn
  if (gameState.currentPlayer !== playerIndex) {
    showNotification("It's not your turn");
    return false;
  }

  const cellValue = gameState.board[row][col];
  if (!cellValue) return false;
  
  // Check if the space is part of an existing sequence
  if (cellValue.inSequence) {
    showNotification("Can't play on a space that's part of a sequence");
    return false;
  }
  
  const playerColor = gameState.players[playerIndex].color;

  // Check if this card is a special jack
  const jackType = SPECIAL_JACKS[card];

  // Handle one-eyed jack (remove token) first
  if (jackType === 'one-eyed') {
    // Can't remove from corner
    if (cellValue.type === 'free') {
      showNotification("Can't remove tokens from free corners");
      return false;
    }

    // Can't remove if no token
    if (!cellValue.token) {
      showNotification("No token to remove here");
      return false;
    }

    // Can't remove your own token
    if (cellValue.token === playerColor) {
      showNotification("Can't remove your own token");
      return false;
    }

    // Can't remove opponent's token that is part of a sequence
    if (cellValue.inSequence) {
      showNotification("Can't remove a token that's part of a sequence");
      return false;
    }

    // Remove the token
    cellValue.token = null;
    return true;
  }

  // Check if the space itself is part of a sequence (double-check)
  if (gameState.sequences.some(seq => 
    seq.positions.some(pos => pos.row === row && pos.col === col)
  )) {
    showNotification("Can't play on a space that's part of a sequence");
    return false;
  }

  // Handle two-eyed jack (wild card)
  if (jackType === 'two-eyed') {
    // Can't place on corner (they're already free)
    if (cellValue.type === 'free') {
      showNotification("Free corners already count for all players");
      return false;
    }

    // Can't place where there's already a token
    if (cellValue.token) {
      showNotification("Space already occupied");
      return false;
    }

    // Place token
    cellValue.token = playerColor;
    checkForSequences(row, col);
    checkWinCondition(playerIndex);
    return true;
  }

  // Handle regular card
  if (cellValue.type === 'free') {
    cellValue.token = playerColor;
    checkForSequences(row, col);
    checkWinCondition(playerIndex);
    return true;
  }

  // Card must match the board position
  if (cellValue.type !== 'card' || cellValue.code !== card) {
    showNotification("Card doesn't match this position");
    return false;
  }

  // Can't place where there's already a token
  if (cellValue.token) {
    showNotification("Space already occupied");
    return false;
  }

  // Place token
  cellValue.token = playerColor;
  checkForSequences(row, col);
  checkWinCondition(playerIndex);
  return true;
}

// Helper function to check win condition
function checkWinCondition(playerIndex) {
  // Make sure sequence count isn't greater than what we actually have
  const actualSequenceCount = gameState.sequences.filter(seq => seq.player === playerIndex).length;
  
  // Update the player's sequence count to match reality
  gameState.players[playerIndex].sequences = actualSequenceCount;
  
  console.log(`Player ${playerIndex} has ${actualSequenceCount} sequences`);
  
  // Check if the player has reached the win condition
  if (actualSequenceCount >= gameState.sequencesToWin) {
    gameState.winner = playerIndex;
    showNotification(`Player ${playerIndex + 1} wins with ${actualSequenceCount} sequences!`);
  }
}

// Helper function to check if a corner is already used in a sequence
function isCornerUsedInSequence(row, col, playerIndex) {
  const cell = gameState.board[row][col];
  
  // If it's not a free corner, it can't be "used" in the special corner-sharing sense
  if (!cell || cell.type !== 'free') {
    return false;
  }
  
  // Check if this corner is already part of a sequence by another player
  return gameState.sequences.some(sequence => 
    sequence.player !== playerIndex && 
    sequence.positions.some(pos => pos.row === row && pos.col === col)
  );
}

// Check for sequences after placing a token
export function checkForSequences(row, col) {
  const playerIndex = gameState.currentPlayer;  // Use currentPlayer instead of host status
  const playerColor = gameState.players[playerIndex].color;
  
  console.log('Checking sequences for player:', playerIndex, 'with color:', playerColor);
  
  // Define possible sequence directions (each sequence must follow a single direction)
  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal down-right
    [1, -1]  // Diagonal down-left
  ];

  // Check each direction separately to ensure sequences maintain consistent direction
  for (const [dx, dy] of directions) {
    // For each possible direction, we'll collect cells in that line
    let directionLine = [];
    
    // Look in both the positive and negative directions to find all connected pieces
    for (let i = -4; i <= 4; i++) {
      const r = row + (i * dx);
      const c = col + (i * dy);
      
      // Skip out of bounds positions
      if (r < 0 || r >= 10 || c < 0 || c >= 10) {
        continue;
      }
      
      const cell = gameState.board[r][c];
      if (!cell) continue;
      
      // Add the position to our direction line if it has player's token or is a free corner
      if (cell.token === playerColor || cell.type === 'free') {
        directionLine.push({
          row: r,
          col: c,
          isFreeCorner: cell.type === 'free'
        });
      } else {
        // Break the line at any opponent token or empty space
        break;
      }
    }
    
    // Now sort the line to ensure consecutive positions
    directionLine.sort((a, b) => {
      if (dx === 0) {
        // Horizontal line sort by column
        return a.col - b.col;
      } else if (dy === 0) {
        // Vertical line sort by row
        return a.row - b.row;
      } else if (dx === 1 && dy === 1) {
        // Diagonal down-right, sort by row (or column, they increase together)
        return a.row - b.row;
      } else {
        // Diagonal down-left, sort by row (as row increases, column decreases)
        return a.row - b.row;
      }
    });
    
    // Find consecutive segments of 5 or more
    for (let startIdx = 0; startIdx <= directionLine.length - 5; startIdx++) {
      // Check if these 5 positions are consecutive
      let isConsecutive = true;
      let segmentPositions = [];
      let freeCornerCount = 0;
      
      for (let j = 0; j < 5; j++) {
        const current = directionLine[startIdx + j];
        segmentPositions.push({ row: current.row, col: current.col });
        
        if (current.isFreeCorner) {
          freeCornerCount++;
        }
        
        // If we're not at the first position, check if position is consecutive
        if (j > 0) {
          const prev = directionLine[startIdx + j - 1];
          const isConsecutivePosition = 
            (dx === 0 && current.col === prev.col + 1 && current.row === prev.row) || // Horizontal
            (dy === 0 && current.row === prev.row + 1 && current.col === prev.col) || // Vertical
            (dx === 1 && dy === 1 && current.row === prev.row + 1 && current.col === prev.col + 1) || // Diagonal down-right
            (dx === 1 && dy === -1 && current.row === prev.row + 1 && current.col === prev.col - 1);  // Diagonal down-left
          
          if (!isConsecutivePosition) {
            isConsecutive = false;
            break;
          }
        }
      }
      
      // Only consider the segment if it has 5 consecutive positions
      if (isConsecutive) {
        // Check if this sequence is already counted
        const isNewSequence = !gameState.sequences.some(seq =>
          arraysEqual(seq.positions.map(p => `${p.row},${p.col}`),
            segmentPositions.map(p => `${p.row},${p.col}`))
        );

        if (isNewSequence) {
          // Check if sequence contains a corner that's already used in another sequence by a different player
          const hasUsedCornerFromOtherPlayer = segmentPositions.some(pos => {
            const cell = gameState.board[pos.row][pos.col];
            return cell.type === 'free' && cell.inSequence && 
                   gameState.sequences.some(seq => 
                     seq.player !== playerIndex &&
                     seq.positions.some(p => p.row === pos.row && p.col === pos.col)
                   );
          });

          if (!hasUsedCornerFromOtherPlayer) {
            // This is a valid new sequence - add it
            gameState.sequences.push({
              player: playerIndex,
              positions: [...segmentPositions],
              direction: dx === 0 ? 'horizontal' : dy === 0 ? 'vertical' : (dx * dy) > 0 ? 'diagonal-right' : 'diagonal-left'
            });
            gameState.players[playerIndex].sequences++;
            
            console.log('New sequence created for player:', playerIndex);
            console.log('Current sequences:', gameState.sequences);
            console.log('Player sequence counts:', gameState.players.map(p => p.sequences));

            // Immediately mark all cells in the sequence
            for (const pos of segmentPositions) {
              const cell = gameState.board[pos.row][pos.col];
              if (cell) {
                cell.inSequence = true;
                if (cell.type === 'free') {
                  // Mark the corner as used and owned
                  cell.token = playerColor;
                  cell.usedInSequence = true;  // Additional flag for corners
                }
              }
            }
          }
        }
      }
    }
  }
}
}

// Helper function to check if a move would create an invalid sequence
function wouldCreateInvalidSequence(row, col, playerIndex) {
  // Only check for corners
  if (gameState.board[row][col].type !== 'free') {
    return false;
  }

  // Check all directions for potential sequences
  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal down-right
    [1, -1]  // Diagonal down-left
  ];

  for (const [dx, dy] of directions) {
    let sequence = [];
    let corners = new Set(); // Track corners that would be used

    // Check 4 positions in both directions
    for (let i = -4; i <= 4; i++) {
      const r = row + (i * dx);
      const c = col + (i * dy);

      if (r < 0 || r >= 10 || c < 0 || c >= 10) continue;

      const cell = gameState.board[r][c];
      if (!cell) continue;

      // For the position being played
      if (r === row && c === col) {
        sequence.push({row: r, col: c});
        continue;
      }

      // For existing positions
      if (cell.type === 'free') {
        if (cell.inSequence) {
          corners.add(`${r},${c}`);
        }
        sequence.push({row: r, col: c});
      } else if (cell.token === gameState.players[playerIndex].color) {
        sequence.push({row: r, col: c});
      } else {
        sequence = [];
        corners.clear();
      }

      // Check if we have a potential sequence with a reused corner
      if (sequence.length >= 5 && corners.size > 0) {
        return true;
      }
    }
  }
  return false;
}

// Helper function to get adjacent corners that could form a sequence
function getAdjacentCorners(row, col) {
  const corners = [];
  const directions = [
    [-4, 0], [-3, 0], [-2, 0], [-1, 0], [1, 0], [2, 0], [3, 0], [4, 0],  // Vertical
    [0, -4], [0, -3], [0, -2], [0, -1], [0, 1], [0, 2], [0, 3], [0, 4],  // Horizontal
    [-4, -4], [-3, -3], [-2, -2], [-1, -1], [1, 1], [2, 2], [3, 3], [4, 4],  // Diagonal
    [-4, 4], [-3, 3], [-2, 2], [-1, 1], [1, -1], [2, -2], [3, -3], [4, -4]   // Anti-diagonal
  ];

  for (const [dx, dy] of directions) {
    const r = row + dx;
    const c = col + dy;
    
    if (r >= 0 && r < 10 && c >= 0 && c < 10) {
      const cell = gameState.board[r][c];
      if (cell && cell.type === 'free') {
        corners.push({ row: r, col: c });
      }
    }
  }

  return corners;
}

// Handle cell click events
export function handleCellClick(event) {
  const cell = event.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const playerIndex = gameState.isHost ? 0 : 1;
  
  // If no card is selected or it's not player's turn, do nothing
  if (gameState.selectedCard === null || gameState.currentPlayer !== playerIndex) return;

  const card = gameState.players[playerIndex].hand[gameState.selectedCard];
  
  if (handleCardPlay(card, row, col)) {
    // Remove the played card from hand
    gameState.players[playerIndex].hand.splice(gameState.selectedCard, 1);
    
    // Draw a new card if there are cards in the deck
    if (gameState.deck.length > 0) {
      gameState.players[playerIndex].hand.push(gameState.deck.pop());
    }
    
    // Switch turns
    gameState.currentPlayer = 1 - gameState.currentPlayer;
    gameState.selectedCard = null;
    
    // Clear all highlights
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('highlight-available'));

    // Update the UI
    updateGameBoard();
    updatePlayerHand();
    updatePlayerInfo();
    
    // Send the updated game state
    sendGameUpdate(gameState);
  }
}

// Helper function to compare arrays
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

// Handle highlighting available moves
export function highlightAvailableMovesImpl(selectedCardIndex) {
  // Clear all highlights
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => cell.classList.remove('highlight-available'));

  if (selectedCardIndex === null) return;

  const playerIndex = gameState.isHost ? 0 : 1;
  const card = gameState.players[playerIndex].hand[selectedCardIndex];

  // If it's not the player's turn, don't highlight
  if (gameState.currentPlayer !== playerIndex) return;

  // Handle special jacks
  const jackType = SPECIAL_JACKS[card];

  if (jackType === 'one-eyed') {
    // One-eyed jack can remove opponent's tokens
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = gameState.board[row][col];
        // Can remove opponent's token if it's not part of a sequence
        if (cell && cell.token && cell.token !== gameState.players[playerIndex].color && !cell.inSequence) {
          const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
          if (cellElement) cellElement.classList.add('highlight-available');
        }
      }
    }
    return;
  }

  if (jackType === 'two-eyed') {
    // Two-eyed jack can be placed on any empty spot
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = gameState.board[row][col];
        // Can place on any cell that isn't a corner and doesn't have a token
        if (cell && cell.type !== 'free' && !cell.token && !cell.inSequence) {
          const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
          if (cellElement) cellElement.classList.add('highlight-available');
        }
      }
    }
    return;
  }

  // For regular cards, find all matching cells
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = gameState.board[row][col];
      // Highlight card positions that match and don't have a token
      if (cell && cell.type === 'card' && cell.code === card && !cell.token && !cell.inSequence) {
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) cellElement.classList.add('highlight-available');
      }
    }
  }
}