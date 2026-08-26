import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciamento de histórico com suporte a Desfazer (Undo / Ctrl+Z).
 */
export function useHistory(initialPresent) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveState = useCallback((stateSnapshot) => {
    setHistory(prev => {
      const past = prev.slice(0, historyIndex + 1);
      return [...past, JSON.parse(JSON.stringify(stateSnapshot))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback((applyStateCallback) => {
    if (historyIndex >= 0) {
      const previousState = history[historyIndex];
      if (applyStateCallback) {
        applyStateCallback(previousState);
      }
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex >= 0;

  return {
    saveState,
    undo,
    canUndo,
    historyIndex
  };
}
