export function showNotification(message) {
    // Just store the message for testing
    showNotification.lastMessage = message;
}

// Clear stored message
showNotification.lastMessage = null;