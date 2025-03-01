import { gameState, initGameState, initializeBoard } from '../js/gameState.js';
import { handleCardPlay } from '../js/cardAction.js';

describe('Board State Validation', () => {
    beforeEach(() => {
        initGameState();
        // Initialize the board
        gameState.board = initializeBoard();
        gameState.currentPlayer = 0;
        gameState.isHost = true;
    });

    test('should detect horizontal sequence', () => {
        // Create a horizontal sequence
        for (let i = 1; i <= 5; i++) {
            const card = `${i}♥`;
            gameState.board[1][i] = { 
                type: 'card',
                code: card,
                token: null
            };
            // Add card to player's hand
            gameState.players[0].hand.push(card);
            // Play the card
            handleCardPlay(card, 1, i);
        }
        
        expect(gameState.players[0].sequences).toBe(1);
    });

    test('should detect vertical sequence', () => {
        // Create a vertical sequence
        for (let i = 1; i <= 5; i++) {
            const card = `${i}♥`;
            gameState.board[i][1] = {
                type: 'card',
                code: card,
                token: null
            };
            // Add card to player's hand
            gameState.players[0].hand.push(card);
            // Play the card
            handleCardPlay(card, i, 1);
        }
        
        expect(gameState.players[0].sequences).toBe(1);
    });

    test('should not count sequence with gaps', () => {
        // Try to create a sequence with a gap
        for (let i = 1; i <= 5; i++) {
            if (i !== 3) { // Skip middle position
                const card = `${i}♥`;
                gameState.board[1][i] = {
                    type: 'card',
                    code: card,
                    token: null
                };
                // Add card to player's hand
                gameState.players[0].hand.push(card);
                // Play the card
                handleCardPlay(card, 1, i);
            }
        }
        
        expect(gameState.players[0].sequences).toBe(0);
    });

    test('should use free corners in sequence', () => {
        // Corner is already free in board layout
        // Create rest of sequence
        for (let i = 1; i <= 4; i++) {
            const card = `${i}♦`;
            gameState.board[0][i] = {
                type: 'card',
                code: card,
                token: null
            };
            // Add card to player's hand
            gameState.players[0].hand.push(card);
            // Play the card
            handleCardPlay(card, 0, i);
        }
        
        expect(gameState.players[0].sequences).toBe(1);
    });
});