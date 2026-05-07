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
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
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

        let liveChroma = new Array(12).fill(0);
        const STABILIZATION_FRAMES = 1000;

        const analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 2048,
          featureExtractors: ['chroma'],
          callback: (features: any) => {
            if (features && features.chroma) {
              // Vitality check: Ensure we are actually getting data (not just zeros)
              const hasSignal = features.chroma.some((c: number) => c > 0.0001);
              if (!hasSignal && frameCountRef.current > 50 && frameCountRef.current % 100 === 0) {
                 console.warn("Sensor active but receiving silence.");
              }

              frameCountRef.current++;
              
              const isFirstMinute = frameCountRef.current < STABILIZATION_FRAMES;
              const progress = Math.min(frameCountRef.current / STABILIZATION_FRAMES, 1);

              features.chroma.forEach((val: number, i: number) => {
                liveChroma[i] = liveChroma[i] * 0.7 + val * 0.3;
                
                if (isFirstMinute) {
                  globalChromaRef.current[i] += val;
                } else {
                  globalChromaRef.current[i] = globalChromaRef.current[i] * 0.999 + val * 0.001;
                }
              });

              if (frameCountRef.current % 15 === 0) {
                const result = detectKey(globalChromaRef.current);
                setAnalysis({
                  ...result,
                  chroma: [...liveChroma],
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
      if (audioContextRef.current) audioContextRef.current.close().catch(console.error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return { analysis, reset, error };
}
