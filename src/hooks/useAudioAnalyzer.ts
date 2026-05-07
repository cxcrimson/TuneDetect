import { useEffect, useRef, useState } from 'react';
import Meyda from 'meyda';
import { detectKey } from '../lib/theory';

export function useAudioAnalyzer(isActive: boolean) {
  const [analysis, setAnalysis] = useState<{
    key: string;
    mode: string;
    confidence: number;
    chroma: number[];
  } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<any>(null);

  const globalChromaRef = useRef(new Array(12).fill(0));

  const reset = () => {
    globalChromaRef.current = new Array(12).fill(0);
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

        // Check if running as a Chrome/Edge extension and has tabCapture permission
        if (typeof chrome !== 'undefined' && chrome.tabCapture) {
          stream = await new Promise((resolve, reject) => {
            chrome.tabCapture.capture({ audio: true, video: false }, (s) => {
              if (s) resolve(s);
              else reject(new Error('Tab capture failed or denied'));
            });
          });
        } else {
          // Fallback to microphone for web preview
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);

        // CRITICAL for extensions: Pipe the captured audio back to the speakers
        // Otherwise, the tab will go silent when captured.
        if (typeof chrome !== 'undefined' && chrome.tabCapture) {
          source.connect(audioContext.destination);
        }

        // Live chroma for the visualizer (faster response)
        let liveChroma = new Array(12).fill(0);
        let frames = 0;

        const analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: source,
          bufferSize: 2048,
          featureExtractors: ['chroma'],
          callback: (features: any) => {
            if (features.chroma) {
              // Update live chroma (fast smoothing for UI feedback)
              features.chroma.forEach((val: number, i: number) => {
                liveChroma[i] = liveChroma[i] * 0.7 + val * 0.3;
                // Update global chroma (VERY slow accumulation for "Overall Key")
                // This builds a histogram of all notes heard so far
                globalChromaRef.current[i] = globalChromaRef.current[i] * 0.999 + val * 0.001;
              });

              frames++;
              // Analyze using Global Chroma for stability
              if (frames % 15 === 0) {
                const result = detectKey(globalChromaRef.current);
                setAnalysis({
                  ...result,
                  chroma: [...liveChroma] 
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
