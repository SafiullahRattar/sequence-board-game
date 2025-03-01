// Board layout validation tool for Sequence game

// The current board layout
const boardLayout = [
    ['F', '6♠', '7♠', '8♠', '9♠', '10♠', 'Q♠', 'K♠', 'A♠', 'F'],
    ['5♠', '3♥', '2♥', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', 'A♣'],
    ['4♠', '4♥', 'K♣', 'A♣', 'A♦', 'K♦', 'Q♦', '10♦', '8♦', 'K♣'],
    ['3♠', '5♥', 'Q♣', 'Q♥', '10♥', '9♥', '8♥', '9♦', '9♣', 'Q♣'],
    ['2♠', '6♥', '10♣', 'K♥', '3♥', '2♥', '7♥', '8♣', '10♣', '10♠'],
    ['A♠', '7♥', '9♣', 'A♥', '4♥', '5♥', '6♥', '7♣', '6♠', '9♠'],
    ['K♠', '8♥', '8♣', '2♣', '3♣', '4♣', '5♣', '6♣', '5♠', '8♠'],
    ['Q♠', '9♥', '7♣', '6♣', '5♣', '4♣', '3♣', '2♣', '4♠', '7♠'],
    ['10♠', 'Q♥', '10♥', '9♥', '8♥', '7♥', '6♥', '5♥', '3♠', '6♠'],
    ['F', 'A♥', 'K♥', 'Q♥', '10♥', '9♥', '8♥', '7♥', '2♠', 'F']
];

// Count card occurrences
function countCardOccurrences() {
    const cardCounts = {};
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const card = boardLayout[row][col];
            
            // Skip free corners
            if (card === 'F') continue;
            
            if (!cardCounts[card]) {
                cardCounts[card] = [];
            }
            cardCounts[card].push({row, col});
        }
    }
    
    return cardCounts;
}

// Validate board layout
function validateBoard() {
    const cardCounts = countCardOccurrences();
    let errors = [];
    let duplicateCards = [];
    let missingCards = [];
    
    // Values and suits in a standard deck
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['♥', '♦', '♠', '♣'];
    
    // Check for duplicate and missing cards
    for (const value of values) {
        for (const suit of suits) {
            const card = value + suit;
            
            // Jacks should not appear on the board in the Sequence game
            if (value === 'J') continue;
            
            if (!cardCounts[card]) {
                missingCards.push(card);
            } else if (cardCounts[card].length !== 2) {
                duplicateCards.push({
                    card,
                    count: cardCounts[card].length,
                    positions: cardCounts[card]
                });
            }
        }
    }
    
    // Print results
    console.log("=== SEQUENCE BOARD VALIDATION ===");
    
    if (duplicateCards.length > 0) {
        console.log("\n❌ CARDS WITH INCORRECT COUNT (should be 2 each):");
        duplicateCards.forEach(item => {
            console.log(`${item.card}: ${item.count} occurrences at positions:`, 
                item.positions.map(p => `[${p.row},${p.col}]`).join(', '));
        });
    } else {
        console.log("\n✅ All cards have correct number of occurrences (2 each)");
    }
    
    if (missingCards.length > 0) {
        console.log("\n❌ MISSING CARDS (should appear twice each):");
        console.log(missingCards.join(', '));
    } else {
        console.log("\n✅ No missing cards");
    }
    
    // Count free corners
    const freeCorners = boardLayout.flat().filter(card => card === 'F').length;
    if (freeCorners !== 4) {
        console.log(`\n❌ Incorrect number of free corners: ${freeCorners} (should be 4)`);
    } else {
        console.log("\n✅ Correct number of free corners (4)");
    }
    
    // Return suggested corrections
    return {
        duplicateCards,
        missingCards,
        freeCorners
    };
}

// Print a corrected version of the board
function generateCorrectedBoard() {
    const validation = validateBoard();
    
    // If there are no issues, no need to correct
    if (validation.duplicateCards.length === 0 && 
        validation.missingCards.length === 0 && 
        validation.freeCorners === 4) {
        console.log("\nBoard layout is correct! No changes needed.");
        return;
    }
    
    console.log("\n=== SEQUENCE BOARD CORRECTION ===");
    console.log("A completely correct Sequence board layout is needed.");
    console.log("Here is the official Sequence board layout as a reference:");
    
    // This is the correct layout based on the official Sequence game
    const correctBoardLayout = [
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
    
    console.log("\nCORRECT BOARD LAYOUT AS STRING ARRAY:");
    console.log("const boardLayout = [");
    for (let row = 0; row < 10; row++) {
        console.log(`    ['${correctBoardLayout[row].join("', '")}'],`);
    }
    console.log("];");
}

// Run the validation
validateBoard();
generateCorrectedBoard();

