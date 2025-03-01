import { initGameState, initializeBoard, gameState } from '../js/gameState.js';
import { handleCardPlay, checkForSequences } from '../js/cardAction.js';

describe('Win Conditions and Sequence Rules', () => {
    beforeEach(() => {
        initGameState();
        gameState.board = initializeBoard();
        gameState.isHost = true;
        gameState.currentPlayer = 0;
        gameState.sequences = [];
        // Give player plenty of cards for sequences
        gameState.players[0].hand = [
            '2♥', '3♥', '4♥', '5♥', '6♥',  // First sequence
            '2♠', '3♠', '4♠', '5♠', '6♠',   // Second sequence
            '2♦', '3♦', '4♦', '5♦', '6♦'    // Attempt overlapping sequence
        ];
    });

    // Helper function to create a sequence and ensure it's properly marked
    function createSequence(startRow, startCol, direction, cards) {
        const results = [];
        for (let i = 0; i < cards.length; i++) {
            const row = direction === 'horizontal' ? startRow : startRow + i;
            const col = direction === 'horizontal' ? startCol + i : startCol;
            
            // Set up the board position
            gameState.board[row][col] = {
                type: 'card',
                code: cards[i],
                token: null,
                inSequence: false
            };
            
            // Play the card
            const result = handleCardPlay(cards[i], row, col);
            results.push(result);
        }
        return results;
    }

    test('should prevent overlapping sequences', () => {
        // Create first sequence horizontally
        const firstSequence = ['2♥', '3♥', '4♥', '5♥', '6♥'];
        const results1 = createSequence(1, 1, 'horizontal', firstSequence);
        results1.forEach(result => expect(result).toBe(true));
        
        // Verify first sequence was created and marked
        expect(gameState.players[0].sequences).toBe(1);
        expect(gameState.board[1][3].inSequence).toBe(true);
        expect(gameState.board[1][3].token).toBe(gameState.players[0].color);

        // Try to create vertical sequence through existing sequence
        const verticalCards = ['2♠', '3♠', '4♠', '5♠', '6♠'];
        for (let i = 0; i < verticalCards.length; i++) {
            const row = i + 1;
            gameState.board[row][3] = {
                type: 'card',
                code: verticalCards[i],
                token: null,
                inSequence: false
            };
        }

        // This should fail when trying to play through the existing sequence
        const result = handleCardPlay(verticalCards[0], 1, 3);
        expect(result).toBe(false);
        expect(globalThis.lastNotification).toBe("Can't play on a space that's part of a sequence");
    });

    test('should win game when reaching required number of sequences', () => {
        // Set winning condition to 2 sequences
        gameState.sequencesToWin = 2;

        // Create first sequence
        const seq1 = ['2♥', '3♥', '4♥', '5♥', '6♥'];
        const results1 = createSequence(1, 1, 'horizontal', seq1);
        results1.forEach(result => expect(result).toBe(true));

        // Verify first sequence was created
        expect(gameState.players[0].sequences).toBe(1);
        expect(gameState.winner).toBeUndefined();

        // Create second sequence (non-overlapping)
        const seq2 = ['2♠', '3♠', '4♠', '5♠', '6♠'];
        const results2 = createSequence(3, 1, 'horizontal', seq2);
        results2.forEach(result => expect(result).toBe(true));

        // Verify win condition
        expect(gameState.players[0].sequences).toBe(2);
        expect(gameState.winner).toBe(0);
        expect(globalThis.lastNotification).toBe("Player 1 wins!");
    });

    test('should count corner pieces only once', () => {
        // First ensure corner is properly initialized
        expect(gameState.board[0][0].type).toBe('free');
        
        // Create first sequence using top-left corner
        const seq1 = ['2♥', '3♥', '4♥', '5♥'];
        const results1 = createSequence(0, 1, 'horizontal', seq1);
        results1.forEach(result => expect(result).toBe(true));

        // Verify first sequence was created and corner is marked
        expect(gameState.players[0].sequences).toBe(1);
        expect(gameState.board[0][0].inSequence).toBe(true);

        // Try to create vertical sequence using same corner
        const verticalCards = ['2♦', '3♦', '4♦', '5♦'];
        for (let i = 0; i < verticalCards.length; i++) {
            const row = i + 1;
            gameState.board[row][0] = {
                type: 'card',
                code: verticalCards[i],
                token: null,
                inSequence: false
            };
        }

        // This should fail when trying to play using the corner again
        const result = handleCardPlay(verticalCards[0], 1, 0);
        expect(result).toBe(false);
        expect(globalThis.lastNotification).toBe("Can't reuse corner in another sequence");
    });
});