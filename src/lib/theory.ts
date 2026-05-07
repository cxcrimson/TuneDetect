/**
 * Musical theory utilities for key detection.
 */

// --- SHA'ATH PROFILES (Reliable for general modern pop) ---
const SHA_MAJOR = [0.748, 0.06, 0.488, 0.082, 0.67, 0.46, 0.096, 0.715, 0.104, 0.457, 0.073, 0.412];
const SHA_MINOR = [0.712, 0.084, 0.337, 0.748, 0.08, 0.402, 0.159, 0.655, 0.45, 0.134, 0.293, 0.137];

// --- TEMPERLEY PROFILES (Mathematically derived, great for harmonic clarity) ---
const TEMP_MAJOR = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];
const TEMP_MINOR = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0];

// --- KRUMHANSL-KESSLER PROFILES (Psychological "Golden Standard") ---
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// --- SIMPLE PROFILES (Often more robust for noisy pop masters) ---
const SIMPLE_MAJOR = [1.0, 0.0, 0.5, 0.0, 0.8, 0.7, 0.0, 0.9, 0.0, 0.6, 0.0, 0.5];
const SIMPLE_MINOR = [1.0, 0.0, 0.5, 0.8, 0.0, 0.6, 0.0, 0.9, 0.5, 0.0, 0.4, 0.0];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getCorrelation(vec1: number[], vec2: number[]) {
  const n = 12;
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

  const denominator = Math.sqrt(den1 * den2);
  if (denominator === 0) return 0;
  return num / denominator;
}

/**
 * Advanced Key Detection logic using Multi-Band Analysis (Bass, Mid, Treble)
 * to resolve common harmonic ambiguities.
 */
export function detectKey(bassChroma: number[], midChroma: number[], highChroma: number[]) {
  // 1. Normalization of bands
  const normalize = (c: number[]) => {
    const sum = c.reduce((a, b) => a + b, 0) || 1;
    return c.map(v => v / sum);
  };

  const nBass = normalize(bassChroma);
  const nMid = normalize(midChroma);
  const nHigh = normalize(highChroma);

  // 2. Hybrid Chroma Synthesis
  // We weight Bass heavily for root, Mid for intervals, High for overtone filtering
  const hybridChroma = new Array(12).fill(0).map((_, i) => (
    nBass[i] * 0.5 +   // Root energy
    nMid[i] * 0.4 +    // Harmonic/Chord energy
    nHigh[i] * 0.1     // High-end presence
  ));

  const candidates: { key: string; mode: string; confidence: number }[] = [];

  for (let i = 0; i < 12; i++) {
    const rotate = (p: number[]) => [...p.slice(12 - i), ...p.slice(0, 12 - i)];
    
    // Committee Weighting with Tri-Band Context
    const profileScore = (
      getCorrelation(hybridChroma, rotate(TEMP_MAJOR)) * 0.4 +
      getCorrelation(nMid, rotate(KK_MAJOR)) * 0.3 +            // Mid band is best for Mode (KK)
      getCorrelation(hybridChroma, rotate(SIMPLE_MAJOR)) * 0.3
    );

    const profileMinorScore = (
      getCorrelation(hybridChroma, rotate(TEMP_MINOR)) * 0.4 +
      getCorrelation(nMid, rotate(KK_MINOR)) * 0.3 +
      getCorrelation(hybridChroma, rotate(SIMPLE_MINOR)) * 0.3
    );

    // --- STRUCTURAL INTERVAL CHECK (Interval Logic) ---
    // Look at functional relationships between the notes
    const rootEnergy = nBass[i]; 
    const fifth = nMid[(i + 7) % 12];
    const major3rd = nMid[(i + 4) % 12];
    const minor3rd = nMid[(i + 3) % 12];
    const sus4 = nMid[(i + 5) % 12];
    const sus2 = nMid[(i + 2) % 12];

    // Calculate structural confidence based on triad/sus patterns
    const majorStructural = (rootEnergy * 1.5 + fifth + Math.max(major3rd, sus4, sus2) * 1.2) / 3;
    const minorStructural = (rootEnergy * 1.5 + fifth + minor3rd * 1.4) / 3;

    candidates.push({ 
      key: NOTE_NAMES[i], 
      mode: 'major', 
      confidence: profileScore * 0.6 + majorStructural * 0.4
    });
    
    candidates.push({ 
      key: NOTE_NAMES[i], 
      mode: 'minor', 
      confidence: profileMinorScore * 0.6 + minorStructural * 0.4
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  // 4. Final Conclusion Heuristics
  let top = candidates[0];
  const topIdx = NOTE_NAMES.indexOf(top.key);
  
  // Pivot Check (Major Bias / Relative Key)
  const topMajor = candidates.find(c => c.mode === 'major');
  if (topMajor && top.mode === 'minor' && topMajor.confidence > top.confidence * 0.95) {
    return { key: topMajor.key, mode: 'major', confidence: topMajor.confidence };
  }

  // Anti-Fifth / Root Confusion Resolution
  const subdominantIdx = (topIdx + 5) % 12;
  const subCandidate = candidates.find(c => c.key === NOTE_NAMES[subdominantIdx]);
  if (subCandidate && nBass[subdominantIdx] > nBass[topIdx] * 1.2 && subCandidate.confidence > top.confidence * 0.9) {
    return { key: subCandidate.key, mode: subCandidate.mode, confidence: subCandidate.confidence };
  }

  return { 
    key: top.key, 
    mode: top.mode, 
    confidence: Math.max(0, (top.confidence + 1) / 2) 
  };
}
