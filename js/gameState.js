export const SUITS = ['♥', '♦', '♠', '♣'];
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SPECIAL_JACKS = {
  'J♥': 'one-eyed', // One-eyed jack (remove)
  'J♠': 'one-eyed', // One-eyed jack (remove)
  'J♦': 'two-eyed', // Two-eyed jack (wild)
  'J♣': 'two-eyed'  // Two-eyed jack (wild)
};

// Board layout (card positions, F = free corner, X = not used)
export const boardLayout = [
  ['F', '10♠', 'Q♠', 'K♠', 'A♠', '2♦', '3♦', '4♦', '5♦', 'F'],
  ['9♠', '10♥', '9♥', '8♥', '7♥', '6♥', '5♥', '4♥', '3♥', '6♦'],
  ['8♠', 'Q♥', '7♦', '8♦', '9♦', '10♦', 'Q♦', 'K♦', '2♥', '7♦'],
  ['7♠', 'K♥', '6♦', '2♣', 'A♥', 'K♥', 'Q♥', 'A♦', '2♠', '8♦'],
  ['6♠', 'A♥', '5♦', '3♣', '4♥', '3♥', '10♥', 'A♣', '3♠', '9♦'],
  ['5♠', '2♣', '4♦', '4♣', '5♥', '2♥', '9♥', 'K♣', '4♠', '10♦'],
  ['4♠', '3♣', '3♦', '5♣', '6♥', '7♥', '8♥', 'Q♣', '5♠', 'Q♦'],
  ['3♠', '4♣', '2♦', '6♣', '7♣', '8♣', '9♣', '10♣', '6♠', 'K♦'],
  ['2♠', '5♣', 'A♠', 'K♠', 'Q♠', '10♠', '9♠', '8♠', '7♠', 'A♦'],
  ['F', '6♣', '7♣', '8♣', '9♣', '10♣', 'Q♣', 'K♣', 'A♣', 'F'],
];

// Global game state
export let gameState = {
  board: [],
  deck: [],
  players: [
    { name: '', hand: [], color: 'blue', sequences: 0 },
    { name: '', hand: [], color: 'green', sequences: 0 }
  ],
  currentPlayer: 0,
  sequencesToWin: 2,
  selectedCard: null,
  sequences: [],
  gameId: null,
  isHost: true
};

// Initialize the game state
export function initGameState() {
  const isDev = window.location.search.includes('dev=true');
  gameState = {
    board: [],
    deck: [],
    players: [
      { name: '', hand: [], color: 'blue', sequences: 0 },
      { name: '', hand: [], color: 'green', sequences: 0 }
    ],
    currentPlayer: 0,
    sequencesToWin: 2,
    selectedCard: null,
    sequences: [],
    gameId: null,
    isHost: true
  };
}

// Initialize the board
export function initializeBoard() {
  const board = [];
  for (let row = 0; row < 10; row++) {
    board[row] = [];
    for (let col = 0; col < 10; col++) {
      const cardCode = boardLayout[row][col];
      if (cardCode === 'F') {
        board[row][col] = { type: 'free', token: null };
      } else if (cardCode !== 'X') {
        board[row][col] = { type: 'card', code: cardCode, token: null };
      } else {
        board[row][col] = { type: 'empty', token: null };
      }
    }
  }
  return board;
}

// Create and shuffle deck
export function createAndShuffleDeck() {
  const deck = [];

  // Add regular cards (2 of each)
  for (let i = 0; i < 2; i++) {
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push(value + suit);
      }
    }
  }

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Deal cards to players
export function dealCards(handSize = 7) {
  for (let i = 0; i < gameState.players.length; i++) {
    while (gameState.players[i].hand.length < handSize && gameState.deck.length > 0) {
      gameState.players[i].hand.push(gameState.deck.pop());
    }
  }
}

// Dev mode configuration
const DEV_MODE = {
  hostHand: ['10♠', 'Q♠', 'K♠', 'A♠', '2♥', '3♥', '4♥'],
  guestHand: ['J♠', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣']
};

// Set game state from server update
export function updateGameFromServer(newGameState) {
  console.log("Updating game from server state:", newGameState);

  // Preserve the client's perspective (host or guest)
  const wasHost = gameState.isHost !== undefined ? gameState.isHost : true;
  
  // Check if we're in dev mode
  const isDevMode = gameState.players[0].name === 'dev';

  // Make a deep copy of the new state
  const updatedState = JSON.parse(JSON.stringify(newGameState));

  // Always preserve the client perspective
  updatedState.isHost = wasHost;

  // Ensure the sequences array exists
  if (!updatedState.sequences) {
    updatedState.sequences = [];
  }

  // Make sure player sequence counts are preserved
  if (updatedState.players && updatedState.players.length >= 2) {
    // Initialize sequence counts if missing
    if (typeof updatedState.players[0].sequences !== 'number') {
      updatedState.players[0].sequences = 0;
    }
    if (typeof updatedState.players[1].sequences !== 'number') {
      updatedState.players[1].sequences = 0;
    }
  }

  // Mark all cells that are part of sequences
  for (const sequence of updatedState.sequences) {
    for (const pos of sequence.positions) {
      if (updatedState.board[pos.row] && updatedState.board[pos.row][pos.col]) {
        updatedState.board[pos.row][pos.col].inSequence = true;
      }
    }
  }

  // Preserve dev mode hands if needed
  if (isDevMode) {
    console.log('Preserving dev mode hands during state update');
    if (wasHost) {
      updatedState.players[0].hand = [...DEV_MODE.hostHand];
    } else {
      updatedState.players[1].hand = [...DEV_MODE.guestHand];
    }
  }

  // Update the game state
  gameState = updatedState;

  // Log the final hand state
  const playerIndex = wasHost ? 0 : 1;
  console.log(`Final hand for player ${playerIndex}:`, gameState.players[playerIndex].hand);
}
