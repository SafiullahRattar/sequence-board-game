
const board = [
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

// Count occurrences
const counts = {};
board.forEach((row, i) => {
  row.forEach((card, j) => {
    if (card !== 'F') {
      counts[card] = (counts[card] || 0) + 1;
    }
  });
});

// Check corners
const corners = [board[0][0], board[0][9], board[9][0], board[9][9]];
console.log('\nChecking corners:');
console.log('All corners are F:', corners.every(c => c === 'F'));

// Check card counts
console.log('\nCards that don\'t appear exactly twice:');
let hasErrors = false;
Object.entries(counts).sort().forEach(([card, count]) => {
  if (count !== 2) {
    console.log(`${card}: ${count} times`);
    hasErrors = true;
  }
});

if (!hasErrors) {
  console.log('Perfect! All cards appear exactly twice.');
}

// Print all heart cards
console.log('\nAll Heart cards in the board:');
board.forEach((row, i) => {
  row.forEach((card, j) => {
    if (card.includes('♥')) {
      console.log(`${card} at position [${i},${j}]`);
    }
  });
});

// Print all diamond cards
console.log('\nAll Diamond cards in the board:');
board.forEach((row, i) => {
  row.forEach((card, j) => {
    if (card.includes('♦')) {
      console.log(`${card} at position [${i},${j}]`);
    }
  });
});

// Specifically check for Ace of Diamonds
console.log('\nChecking Ace of Diamonds:');
const aceOfDiamonds = 'A♦';
if (counts[aceOfDiamonds]) {
  console.log(`${aceOfDiamonds} appears ${counts[aceOfDiamonds]} times`);
} else {
  console.log(`${aceOfDiamonds} is missing from the board!`);
}

// Find cards appearing more than twice
console.log('\nCards appearing more than twice:');
Object.entries(counts).forEach(([card, count]) => {
  if (count > 2) {
    console.log(`${card} appears ${count} times at these positions:`);
    board.forEach((row, i) => {
      row.forEach((c, j) => {
        if (c === card) {
          console.log(`  - Position [${i},${j}]`);
        }
      });
    });
  }
});

// Count cards by suit
const suitCounts = {
  '♠': 0,
  '♣': 0,
  '♥': 0,
  '♦': 0
};

board.forEach(row => {
  row.forEach(card => {
    if (card !== 'F') {
      for (const suit of ['♠', '♣', '♥', '♦']) {
        if (card.includes(suit)) {
          suitCounts[suit]++;
        }
      }
    }
  });
});

console.log('\nCards by suit:');
Object.entries(suitCounts).forEach(([suit, count]) => {
  console.log(`${suit}: ${count} cards`);
});

// Total cards (should be 96 - as each of 48 cards appears twice)
const totalCards = Object.values(counts).reduce((sum, count) => sum + count, 0);
console.log(`\nTotal cards (excluding corners): ${totalCards} (should be 96)`);

