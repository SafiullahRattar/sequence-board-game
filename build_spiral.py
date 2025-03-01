def replace_suits(board, replacements):
    """
    Replace suits in the board with specified characters.

    :param board: 2D list representing the Sequence board.
    :param replacements: Dictionary mapping suits to new characters.
    :return: Modified board with replaced suits.
    """
    new_board = []
    for row in board:
        new_row = []
        for cell in row:
            if cell == "F":  # Preserve corners
                new_row.append(cell)
            else:
                for suit, replacement in replacements.items():
                    if suit in cell:
                        cell = cell.replace(suit, replacement)
                new_row.append(cell)
        new_board.append(new_row)
    return new_board


# Example Sequence Board
sequence_board = [
    ["F", "10S", "QS", "KS", "AS", "2D", "3D", "4D", "5D", "F"],
    ["9S", "10H", "9H", "8H", "7H", "6H", "5H", "4H", "3H", "6D"],
    ["8S", "QH", "7D", "8D", "9D", "10D", "QD", "KD", "2H", "7D"],
    ["7S", "KH", "6D", "2C", "AH", "KH", "QH", "AD", "2S", "8D"],
    ["6S", "AH", "5D", "3C", "4H", "3H", "10H", "AC", "3S", "9D"],
    ["5S", "2C", "4D", "4C", "5H", "2H", "9H", "KC", "4S", "10D"],
    ["4S", "3C", "3D", "5C", "6H", "7H", "8H", "QC", "5S", "QD"],
    ["3S", "4C", "2D", "6C", "7C", "8C", "9C", "10C", "6S", "KD"],
    ["2S", "5C", "AS", "KS", "QS", "10S", "9S", "8S", "7S", "AD"],
    ["F", "6C", "7C", "8C", "9C", "10C", "QC", "KC", "AC", "F"],
]

# Define your replacements
replacements = {
    "C": "♣",  # Clubs
    "H": "♥",  # Hearts
    "S": "♠",  # Spades
    "D": "♦",  # Diamonds
}

# Get the modified board
modified_board = replace_suits(sequence_board, replacements)

# Print the new board
for row in modified_board:
    print(row)
