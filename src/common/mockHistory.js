const STORAGE_KEY = 'mockAnalysisHistory';

export function loadHistory() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to parse stored mock history', error);
  }
  return [];
}

export function saveHistory(history) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function appendHistoryEntry(history, entry) {
  const next = [entry, ...history];
  saveHistory(next);
  return next;
}
