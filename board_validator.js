// Board layout (card positions, F = free corner)
const boardLayout = [
    ['F',   '2♠',  '3♠',  '4♠',  '5♠',  '6♠',  '7♠',  '8♠',  '9♠',  'F'],
    ['6♣',  '5♣',  '4♣',  '3♣',  '2♣',  'A♣',  'K♣',  'Q♣',  '10♠', '10♣'],
    ['7♣',  'A♥',  '2♦',  '3♦',  '4♦',  '5♦',  '6♦',  '10♣', 'Q♠',  '9♣'],
    ['8♣',  'K♥',  '6♣',  '5♣',  '4♣',  '3♣',  '2♦',  '9♣',  'K♠',  '8♣'],
    ['9♣',  'Q♥',  '7♣',  '6♥',  '5♥',  '4♥',  'A♦',  '8♣',  'A♠',  '7♣'],
    ['10♣', '10♥', '8♣',  '7♥',  '2♥',  '3♥',  'K♦',  '7♣',  '2♠',  '6♣'],
    ['Q♣',  '9♥',  '9♣',  '8♥',  '9♥',  '10♥', 'Q♦',  '6♣',  '3♠',  '5♣'],
    ['K♣',  '8♥',  '10♣', 'Q♣',  'K♣',  'A♣',  'J♥',  '5♣',  '4♠',  '4♣'],
    ['A♣',  '7♥',  '6♥',  '5♥',  '4♥',  '3♥',  '2♥',  '4♣',  '5♠',  '3♣'],
    ['F',   '2♥',  '3♥',  '4♥',  '5♥',  '6♥',  '7♥',  '8♥',  '9♥',  'F']
];

// Count each card's occurrences
const cardCount = new Map();

// Count all cards
for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
        const card = boardLayout[row][col];
        if (card !== 'F') {
            cardCount.set(card, (cardCount.get(card) || 0) + 1);
        }
    }
}

// Print results
console.log("Card counts:");
for (const [card, count] of cardCount) {
    console.log(`${card}: ${count}`);
}

// Check corners
const corners = [
    boardLayout[0][0],
    boardLayout[0][9],
    boardLayout[9][0],
    boardLayout[9][9]
];

console.log("\nChecking corners:");
console.log("All corners are 'F':", corners.every(corner => corner === 'F'));

// Calculate total cards (excluding corners)
const totalCards = Array.from(cardCount.values()).reduce((sum, count) => sum + count, 0);
console.log("\nTotal cards (excluding corners):", totalCards);

// Print cards that don't appear exactly twice
console.log("\nCards that don't appear exactly twice:");
for (const [card, count] of cardCount) {
    if (count !== 2) {
        console.log(`${card}: ${count} times`);
    }
}