export function scheduleQueuedAudioRefresh(refresh: () => void) {
  refresh();

  [2000, 5000].forEach((delay) => {
    window.setTimeout(() => {
      refresh();
    }, delay);
  });
}