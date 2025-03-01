// Test corrected board layout for validation
// This should have every card appear exactly twice

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

// Validation function to count card occurrences
function validateBoardLayout() {
    const cardCounts = {};
    let freeCorners = 0;
    
    // Count occurrences of each card
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const card = boardLayout[row][col];
            
            if (card === 'F') {
                freeCorners++;
                continue;
            }
            
            if (!cardCounts[card]) {
                cardCounts[card] = [];
            }
            cardCounts[card].push({row, col});
        }
    }
    
    // Check for issues
    const issues = [];
    for (const card in cardCounts) {
        const count = cardCounts[card].length;
        if (count !== 2) {
            issues.push(`${card} appears ${count} times: ${JSON.stringify(cardCounts[card])}`);
        }
    }
    
    // Print results
    console.log("=== BOARD LAYOUT VALIDATION ===");
    console.log(`Free corners: ${freeCorners} (expected: 4)`);
    console.log(`Total unique cards: ${Object.keys(cardCounts).length}`);
    console.log(`Total card positions: ${Object.values(cardCounts).flat().length}`);
    
    if (issues.length > 0) {
        console.log("\nIssues found:");
        issues.forEach(issue => console.log("- " + issue));
    } else {
        console.log("\nBoard layout is correct! All cards appear exactly twice.");
    }
}

validateBoardLayout();
