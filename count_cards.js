const suits = ['♥', '♦', '♠', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K'];

// Create a simple printable count for each card in the board
function countCards() {
    // Print each row of the board with cards aligned
    console.log("Board Layout:\n");
    boardLayout.forEach((row, i) => {
        console.log(`Row ${i}: ${row.join('\t')}`);
    });
    
    // Count each card
    let cardCounts = {};
    boardLayout.forEach(row => {
        row.forEach(card => {
            if (card !== 'F') {
                cardCounts[card] = (cardCounts[card] || 0) + 1;
            }
        });
    });
    
    // Print counts by suit
    console.log("\nCard Counts By Suit:\n");
    suits.forEach(suit => {
        console.log(`\n${suit}:`);
        values.forEach(value => {
            const card = value + suit;
            if (cardCounts[card]) {
                console.log(`${card}: ${cardCounts[card]} times`);
            }
        });
    });
    
    // Print issues
    console.log("\nPossible Issues:");
    Object.entries(cardCounts).forEach(([card, count]) => {
        if (count !== 2) {
            console.log(`${card} appears ${count} times (should be 2)`);
        }
    });
}

countCards();