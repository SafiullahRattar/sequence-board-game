// Fixed highlighting function for Sequence game
// This ensures each card is properly highlighted (exactly two positions per card)

// Highlight available moves for the selected card
function highlightAvailableMoves(selectedCard) {
    // Clear any existing highlights
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('highlight-available');
    });
    
    if (selectedCard === null) return;
    
    const playerIndex = gameState.isHost ? 0 : 1;
    const cardValue = gameState.players[playerIndex].hand[selectedCard];
    
    // Handle special jacks differently
    if (SPECIAL_JACKS[cardValue]) {
        if (SPECIAL_JACKS[cardValue] === 'one-eyed') {
            // One-eyed jack: highlight opponent tokens not in sequences
            const opponentIndex = playerIndex === 0 ? 1 : 0;
            const opponentColor = gameState.players[opponentIndex].color;
            let highlightCount = 0;
            
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = gameState.board[row][col];
                    if (cell && cell.token === opponentColor && !isTokenInSequence(row, col)) {
                        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        if (cellElement) {
                            cellElement.classList.add('highlight-available');
                            highlightCount++;
                        }
                    }
                }
            }
            
            if (highlightCount === 0) {
                showNotification("No opponent tokens available to remove");
            }
        } else if (SPECIAL_JACKS[cardValue] === 'two-eyed') {
            // Two-eyed jack: highlight all empty spaces that aren't free corners
            let highlightCount = 0;
            
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const cell = gameState.board[row][col];
                    if (cell && cell.type === 'card' && cell.token === null) {
                        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        if (cellElement) {
                            cellElement.classList.add('highlight-available');
                            highlightCount++;
                        }
                    }
                }
            }
            
            if (highlightCount === 0) {
                showNotification("No empty spaces available");
            }
        }
    } else {
        // Regular card: highlight matching card spaces (should be exactly 2)
        let highlightCount = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = gameState.board[row][col];
                if (cell && cell.type === 'card' && cell.code === cardValue && cell.token === null) {
                    const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    if (cellElement) {
                        cellElement.classList.add('highlight-available');
                        highlightCount++;
                    }
                }
            }
        }
        
        console.log(`Highlighted ${highlightCount} positions for card ${cardValue}`);
        
        if (highlightCount === 0) {
            showNotification(`No available spaces for ${cardValue}`);
        } else if (highlightCount !== 2 && highlightCount !== 1) {
            console.warn(`Warning: Found ${highlightCount} positions for card ${cardValue}, expected 1 or 2`);
        }
    }
}
