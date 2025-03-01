// Fixed Initialize Board function for Sequence game
// This ensures the board data structure matches the board layout

// Initialize the board
function initializeBoard() {
    const board = [];
    for (let row = 0; row < 10; row++) {
        board[row] = [];
        for (let col = 0; col < 10; col++) {
            const cardCode = boardLayout[row][col];
            if (cardCode === 'F') {
                board[row][col] = { type: 'free', token: null };
            } else {
                board[row][col] = { type: 'card', code: cardCode, token: null };
            }
        }
    }
    return board;
}
