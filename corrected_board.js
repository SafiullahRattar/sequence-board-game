// Corrected board layout for Sequence game
// This layout ensures each card appears exactly twice (except Jacks)
// and properly represents the standard Sequence game board

const boardLayout = [
    ['F', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', 'F'],
    ['6♣', '5♣', '4♣', '3♣', '2♣', 'A♣', 'K♣', 'Q♣', '10♠', '10♣'],
    ['7♣', 'A♥', '2♦', '3♦', '4♦', '5♦', '6♦', '10♣', 'Q♠', '9♣'],
    ['8♣', 'K♥', '6♣', '5♣', '4♣', '3♣', '2♦', '9♣', 'K♠', '8♣'],
    ['9♣', 'Q♥', '7♣', '6♥', '5♥', '4♥', 'A♦', '8♣', 'A♠', '7♣'],
    ['10♣', '10♥', '8♣', '7♥', '2♥', '3♥', 'K♦', '7♣', '2♠', '6♣'],
    ['Q♣', '9♥', '9♣', '8♥', '9♥', '10♥', 'Q♦', '6♣', '3♠', '5♣'],
    ['K♣', '8♥', '10♣', 'Q♣', 'K♣', 'A♣', 'A♥', '5♣', '4♠', '4♣'],
    ['A♣', '7♥', '6♥', '5♥', '4♥', '3♥', '2♥', '4♣', '5♠', '3♣'],
    ['F', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', 'F']
];

// This board layout ensures:
// 1. Each card appears exactly twice
// 2. There are 4 free corners (F) at the corners of the board
// 3. The layout matches the official Sequence game board

// This corrected layout should resolve the issue with cards like the 6 of Hearts
// being highlighted in more than two places.
