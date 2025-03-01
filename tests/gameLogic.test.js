import { initGameState, createAndShuffleDeck, dealCards, gameState, initializeBoard } from '../js/gameState.js';
import { handleCardPlay } from '../js/cardAction.js';

describe('Game State Management', () => {
    beforeEach(() => {
        initGameState();
        gameState.board = initializeBoard();
        gameState.deck = createAndShuffleDeck();
        gameState.isHost = true;
        // Only deal to first player initially
        gameState.players[0].hand = gameState.deck.splice(0, 7);
        // Reset notification
        globalThis.lastNotification = null;
    });

    test('initial game state should be properly set up', () => {
        expect(gameState.players.length).toBe(2);
        expect(gameState.deck.length).toBeGreaterThan(0);
        expect(gameState.currentPlayer).toBe(0);
        expect(gameState.board).toBeDefined();
    });

    test('each player should have correct initial hand size', () => {
        expect(gameState.players[0].hand.length).toBe(7);
        expect(gameState.players[1].hand.length).toBe(0); // Guest's hand is dealt when they join
    });

    test('deck should have correct number of cards after initial deal', () => {
        const totalCards = 104; // Two standard decks
        const dealtCards = 7; // Initial cards for first player
        expect(gameState.deck.length).toBe(totalCards - dealtCards);
    });

    test('each card in deck should be valid', () => {
        const validSuits = ['♥', '♦', '♠', '♣'];
        const validValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        gameState.deck.forEach(card => {
            const value = card.slice(0, -1);
            const suit = card.slice(-1);
            expect(validSuits).toContain(suit);
            expect(validValues).toContain(value);
        });
    });
});

describe('Card Playing Logic', () => {
    beforeEach(() => {
        initGameState();
        gameState.board = initializeBoard();
        gameState.deck = createAndShuffleDeck();
        gameState.isHost = true;
        gameState.currentPlayer = 0;
        // Deal specific cards for testing
        gameState.players[0].hand = ['2♥', '3♥', '4♥', '5♥', 'J♠', 'J♦', 'K♠'];
        // Reset notification
        globalThis.lastNotification = null;
    });

    test('should not allow playing when not player\'s turn', () => {
        gameState.currentPlayer = 1; // Set to opponent's turn
        const result = handleCardPlay('2♥', 1, 1);
        expect(result).toBe(false);
        expect(globalThis.lastNotification).toBe("It's not your turn");
    });

    test('should allow playing card on matching board position', () => {
        const card = '2♥';
        // Find a valid position for this card on the board
        let validPosition = null;
        for (let row = 0; row < 10 && !validPosition; row++) {
            for (let col = 0; col < 10; col++) {
                if (gameState.board[row][col]?.code === card) {
                    validPosition = { row, col };
                    break;
                }
            }
        }
        
        if (validPosition) {
            const result = handleCardPlay(card, validPosition.row, validPosition.col);
            expect(result).toBe(true);
            expect(gameState.board[validPosition.row][validPosition.col].token)
                .toBe(gameState.players[0].color);
        } else {
            // Skip test if no valid position found
            console.log('No valid position found for test card');
        }
    });
});