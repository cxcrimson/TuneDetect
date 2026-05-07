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

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<any>(null);

  const globalChromaRef = useRef(new Array(12).fill(0));
  const frameCountRef = useRef(0);

  const reset = () => {
    globalChromaRef.current = new Array(12).fill(0);
    frameCountRef.current = 0;
    setAnalysis(null);
  };

  useEffect(() => {
    if (!isActive) {
      if (analyzerRef.current) analyzerRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      return;
    }

    const startAnalysis = async () => {
      try {
        let stream: MediaStream;

        if (typeof chrome !== 'undefined' && chrome.tabCapture) {
          stream = await new Promise((resolve, reject) => {
            chrome.tabCapture.capture({ audio: true, video: false }, (s) => {
              if (s) resolve(s);
              else reject(new Error('Tab capture failed or denied'));
            });
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);

        if (typeof chrome !== 'undefined' && chrome.tabCapture) {
          source.connect(audioContext.destination);
        }

        let liveChroma = new Array(12).fill(0);
        
        // Target: ~45 seconds of audio for full stabilization
        // With 2048 buffer @ 48kHz, that's roughly 23 frames per second.
        // 45 seconds * 23 fps = ~1000 frames.
        const STABILIZATION_FRAMES = 1000;

        const analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 2048,
          featureExtractors: ['chroma'],
          callback: (features: any) => {
            if (features.chroma) {
              frameCountRef.current++;
              
              const isFirstMinute = frameCountRef.current < STABILIZATION_FRAMES;
              const progress = Math.min(frameCountRef.current / STABILIZATION_FRAMES, 1);

              features.chroma.forEach((val: number, i: number) => {
                liveChroma[i] = liveChroma[i] * 0.7 + val * 0.3;
                
                if (isFirstMinute) {
                  // Pure accumulation for building the initial histogram
                  globalChromaRef.current[i] += val;
                } else {
                  // Transition to leaky integrator for long-term drift tracking
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
        console.error('Failed to start audio analysis', err);
      }
    };

    startAnalysis();

    return () => {
      if (analyzerRef.current) analyzerRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return { analysis, reset };
}
