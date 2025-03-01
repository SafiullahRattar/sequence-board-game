import { getUrlParams } from './uiController.js';
import { gameState } from './gameState.js';

// DOM Element references
const joinForm = document.getElementById('joinForm');
const joinCode = document.getElementById('joinCode');

// Show join option if game ID is in URL
export function showJoinOption() {
  const params = getUrlParams();

  if (params.gameId) {
    joinForm.style.display = 'block';
    joinCode.value = params.gameId;
    gameState.isHost = false;
  } else {
    // Show join option with empty code
    setTimeout(() => {
      joinForm.style.display = 'block';
    }, 2000);
  }
}
