/**
 * Utilitários para criação e manipulação da árvore de chaveamento da Copa do Mundo 2026.
 */

export const createEmptyMatches = () => {
  const matches = {};
  
  const addMatches = (prefix, count, nextPrefix) => {
    for (let i = 1; i <= count; i++) {
      matches[`${prefix}_${i}`] = {
        t1: null,
        t2: null,
        winner: null,
        nextMatch: nextPrefix ? `${nextPrefix}_${Math.ceil(i/2)}` : null,
        nextSlot: i % 2 !== 0 ? 't1' : 't2'
      };
    }
  };

  addMatches('l1', 8, 'l2');
  addMatches('l2', 4, 'l3');
  addMatches('l3', 2, 'l4');
  addMatches('l4', 1, 'final');

  addMatches('r1', 8, 'r2');
  addMatches('r2', 4, 'r3');
  addMatches('r3', 2, 'r4');
  addMatches('r4', 1, 'final');

  // Center matches
  matches['final_1'] = { t1: null, t2: null, winner: null, nextMatch: 'champion', nextSlot: 't1' };
  matches['champion'] = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };
  matches['third_1'] = { t1: null, t2: null, winner: null, nextMatch: 'third_winner', nextSlot: 't1' };
  matches['third_winner'] = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };

  // Fix right semifinal feeding into final_1 t2
  matches['r4_1'].nextSlot = 't2';

  return matches;
};
