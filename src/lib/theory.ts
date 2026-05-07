/**
 * Musical theory utilities for key detection.
 */

// Sha'ath Key Profiles (Refined from libkeyfinder/KeyFinder)
// These profiles are specifically tuned for accurate classification of modern music.
export const MAJOR_PROFILE = [0.748, 0.06, 0.488, 0.082, 0.67, 0.46, 0.096, 0.715, 0.104, 0.457, 0.073, 0.412];
export const MINOR_PROFILE = [0.712, 0.084, 0.337, 0.748, 0.08, 0.402, 0.159, 0.655, 0.45, 0.134, 0.293, 0.137];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getCorrelation(vec1: number[], vec2: number[]) {
  const n = vec1.length;
  const mean1 = vec1.reduce((a, b) => a + b, 0) / n;
  const mean2 = vec2.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den1 = 0;
  let den2 = 0;

  for (let i = 0; i < n; i++) {
    const d1 = vec1[i] - mean1;
    const d2 = vec2[i] - mean2;
    num += d1 * d2;
    den1 += d1 * d1;
    den2 += d2 * d2;
  }

  return num / Math.sqrt(den1 * den2);
}

export function detectKey(chroma: number[]) {
  // Normalize chroma (0-1 range)
  const maxChroma = Math.max(...chroma, 0.0001);
  const normalizedChroma = chroma.map(v => v / maxChroma);

  let bestKey = '';
  let maxCorr = -Infinity;
  let detectedMode: 'major' | 'minor' = 'major';

  for (let i = 0; i < 12; i++) {
    // Current templates are for C major/minor. 
    // Shift them to check C, C#, D, etc.
    const rotatedMajor = [...MAJOR_PROFILE.slice(12 - i), ...MAJOR_PROFILE.slice(0, 12 - i)];
    const rotatedMinor = [...MINOR_PROFILE.slice(12 - i), ...MINOR_PROFILE.slice(0, 12 - i)];

    const corrMajor = getCorrelation(normalizedChroma, rotatedMajor);
    const corrMinor = getCorrelation(normalizedChroma, rotatedMinor);

    if (corrMajor > maxCorr) {
      maxCorr = corrMajor;
      bestKey = NOTE_NAMES[i];
      detectedMode = 'major';
    }
    if (corrMinor > maxCorr) {
      maxCorr = corrMinor;
      bestKey = NOTE_NAMES[i];
      detectedMode = 'minor';
    }
  }

  // Map correlation to 0-1 confidence range (it's usually 0.5-0.9 for good hits)
  const confidence = Math.max(0, (maxCorr + 1) / 2);
  return { key: bestKey, mode: detectedMode, confidence };
}
