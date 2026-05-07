import { useEffect, useRef, useState } from 'react';
import Meyda from 'meyda';
import { detectKey } from '../lib/theory';

export function useAudioAnalyzer(isActive: boolean) {
  const [analysis, setAnalysis] = useState<{
    key: string;
    mode: string;
    confidence: number;
    chroma: number[];
    isStabilized: boolean;
    progress: number; // 0 to 1
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<any>(null);

  const globalChromaRef = useRef(new Array(12).fill(0));
  const frameCountRef = useRef(0);

  const reset = () => {
    globalChromaRef.current = new Array(12).fill(0);
    frameCountRef.current = 0;
    setAnalysis(null);
    setError(null);
  };

  useEffect(() => {
    if (!isActive) {
      if (analyzerRef.current) analyzerRef.current.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      return;
    }

    const startAnalysis = async () => {
      try {
        setError(null);
        let stream: MediaStream;

        if (typeof chrome !== 'undefined' && chrome.tabCapture && chrome.tabCapture.capture) {
          stream = await new Promise((resolve, reject) => {
            chrome.tabCapture.capture({ audio: true, video: false }, (s) => {
              if (s) {
                resolve(s);
              } else {
                const msg = chrome.runtime.lastError?.message || "Capture failed. Make sure you are on a tab with audio playing.";
                reject(new Error(msg));
              }
            });
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        streamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(stream);

        // Required for tabCapture so user can still hear the audio
        if (typeof chrome !== 'undefined' && chrome.tabCapture) {
          source.connect(audioContext.destination);
        }

        let liveBassChroma = new Array(12).fill(0);
        let liveMidChroma = new Array(12).fill(0);
        let liveHighChroma = new Array(12).fill(0);

        const STABILIZATION_FRAMES = 1000;
        
        // Accumulators for long-term stabilization
        const bassAcc = new Array(12).fill(0);
        const midAcc = new Array(12).fill(0);
        const highAcc = new Array(12).fill(0);

        const analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 2048,
          featureExtractors: ['chroma', 'spectralCentroid', 'spectralFlatness', 'buffer'],
          callback: (features: any) => {
            if (features && features.chroma) {
              frameCountRef.current++;
              
              const isFirstMinute = frameCountRef.current < STABILIZATION_FRAMES;
              const progress = Math.min(frameCountRef.current / STABILIZATION_FRAMES, 1);

              // 1. Tonal Gate (Harmonic Percussive Separation approximation)
              // Low flatness means tonal (musical) signal. High flatness means noise or drums.
              const flatness = features.spectralFlatness || 0;
              const tonalGate = Math.max(0.05, 1 - flatness * 1.5);

              // 2. Segregate Bands
              const centroid = features.spectralCentroid || 0;
              const weightBass = Math.max(0, 1 - centroid / 2500);
              const weightTreble = Math.max(0, (centroid - 1500) / 4500);

              features.chroma.forEach((val: number, i: number) => {
                const gatedVal = val * tonalGate;

                // Low Band (Bass Focus)
                const bassVal = gatedVal * (1.3 - (i % 12) * 0.03) * weightBass;
                liveBassChroma[i] = liveBassChroma[i] * 0.8 + bassVal * 0.2;
                
                // Mid Band (Harmonic Focus)
                const midVal = gatedVal * (1 - Math.abs(6 - (i % 12)) * 0.05);
                liveMidChroma[i] = liveMidChroma[i] * 0.8 + midVal * 0.2;

                // High Band (Spectral noise filtering)
                const highVal = gatedVal * weightTreble;
                liveHighChroma[i] = liveHighChroma[i] * 0.8 + highVal * 0.2;

                if (isFirstMinute) {
                  bassAcc[i] += bassVal;
                  midAcc[i] += midVal;
                  highAcc[i] += highVal;
                } else {
                  bassAcc[i] = bassAcc[i] * 0.9992 + bassVal * 0.0008;
                  midAcc[i] = midAcc[i] * 0.9992 + midVal * 0.0008;
                  highAcc[i] = highAcc[i] * 0.9992 + highVal * 0.0008;
                }
              });

              if (frameCountRef.current % 15 === 0) {
                const result = detectKey(bassAcc, midAcc, highAcc);
                setAnalysis({
                  ...result,
                  chroma: [...liveMidChroma], // We use midChroma for UI visualization
                  isStabilized: !isFirstMinute,
                  progress
                });
              }
            }
          },
        });

        analyzer.start();
        analyzerRef.current = analyzer;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to start audio analysis', err);
        setError(message);
      }
    };

    startAnalysis();

    return () => {
      if (analyzerRef.current) analyzerRef.current.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return { analysis, reset, error };
}
