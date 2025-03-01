// UI controller functions

// Show notification toast
export function showNotification(message, duration = 3000) {
  // Always store the message for testing
  globalThis.lastNotification = message;

  // If we're in a browser environment, show the notification
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.style.display = 'block';

      setTimeout(() => {
        notification.style.display = 'none';
      }, duration);
    }
  }
}

// Check URL parameters for game join
export function getUrlParams() {
  if (typeof window === 'undefined') {
    return { gameId: null };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    gameId: params.get('game')
  };
}