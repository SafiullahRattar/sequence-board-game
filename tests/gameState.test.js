import { gameState, initGameState, createAndShuffleDeck } from '../js/gameState.js';

describe('Game State', () => {
    beforeEach(() => {
        initGameState();
    });

    test('should initialize with correct default values', () => {
        expect(gameState.players.length).toBe(2);
        expect(gameState.currentPlayer).toBe(0);
        expect(gameState.sequencesToWin).toBe(2);
    });

    test('should create deck with correct number of cards', () => {
        const deck = createAndShuffleDeck();
        expect(deck.length).toBe(104); // 52 cards × 2 decks
    });

    test('players should start with empty hands', () => {
        expect(gameState.players[0].hand).toHaveLength(0);
        expect(gameState.players[1].hand).toHaveLength(0);
    });
});