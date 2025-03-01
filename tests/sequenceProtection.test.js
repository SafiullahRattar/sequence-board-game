import { initGameState, initializeBoard, gameState } from '../js/gameState.js';
import { handleCardPlay, checkForSequences } from '../js/cardAction.js';

describe('Sequence Protection', () => {
    beforeEach(() => {
        initGameState();
        gameState.board = initializeBoard();
        // Setup players
        gameState.isHost = true;  // First player
        gameState.currentPlayer = 0;
        gameState.players[0].hand = ['2♥', '3♥', '4♥', '5♥', '6♥'];
        gameState.players[1].hand = ['J♠'];  // One-eyed jack for removal
    });

    test('should not allow removing chips that are part of a sequence', () => {
        // First player creates a sequence
        for (let i = 1; i <= 5; i++) {
            // Setup board positions for the sequence
            gameState.board[1][i] = {
                type: 'card',
                code: `${i}♥`,
                token: null
            };
            // Play cards to create sequence
            const result = handleCardPlay(`${i}♥`, 1, i);
            expect(result).toBe(true);
        }

        // Verify sequence was created
        expect(gameState.players[0].sequences).toBe(1);
        expect(gameState.board[1][3].inSequence).toBe(true);  // Check middle piece

        // Switch to player 2
        gameState.isHost = false;
        gameState.currentPlayer = 1;

        // Try to remove a chip from the sequence using one-eyed jack
        const result = handleCardPlay('J♠', 1, 3);  // Try to remove middle piece
        
        // Should not be able to remove the chip
        expect(result).toBe(false);
        expect(globalThis.lastNotification).toBe("Can't remove a token that's part of a sequence");
        // Verify chip is still there
        expect(gameState.board[1][3].token).toBe(gameState.players[0].color);
    });
});