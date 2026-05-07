import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Music, Settings, Activity, Search, X, Info } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import { YoutubePlayer } from './components/YoutubePlayer';
import { NOTE_NAMES } from './lib/theory';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const { analysis, reset, error } = useAudioAnalyzer(isListening);

  const handleVideoSelect = () => {
    reset(); // Clear old spectral data when song changes
    if (!isListening) setIsListening(true);
  };

  return (
    <div className="h-[600px] w-[780px] bg-[#050507] text-[#e0e0e0] font-sans flex flex-col overflow-hidden relative">
      {/* Atmospheric Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5] opacity-10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ec4899] opacity-10 rounded-full blur-[120px]" />
      </div>

      {/* Status Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-16 left-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl p-3 rounded-lg flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-red-500" />
                <p className="text-[10px] text-gray-300 font-medium">{error}</p>
              </div>
              <button onClick={reset} className="text-gray-500 hover:text-white p-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            TuneDetect Pro
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-neutral-700'}`} />
            <span className={`text-[9px] font-bold tracking-widest uppercase ${isListening ? 'text-emerald-500' : 'text-neutral-500'}`}>
              {isListening ? 'Live' : 'Idle'}
            </span>
          </div>
          <button className="p-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all">
            <Settings className="w-3 h-3 text-neutral-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex px-8 py-6 gap-8 z-10 overflow-hidden">
        {/* Left Column: Primary Key Display */}
        <div className="flex-[1.1] flex flex-col justify-center items-center relative min-h-0">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Background Decorative Rings */}
            <div className="w-[380px] h-[380px] border border-dashed border-white/5 rounded-full opacity-30 animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-[340px] h-[340px] rounded-full border-[1px] border-white/5 flex items-center justify-center">
              <div className="w-[280px] h-[280px] rounded-full border-[1px] border-indigo-500/20 flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.05)]">
                <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Progress Ring Overlay */}
                  {analysis && !analysis.isStabilized && (
                    <div className="absolute inset-0 z-0 opacity-20">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${analysis.progress * 100}%` }}
                      ></div>
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    {analysis ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: analysis.isStabilized ? 1 : 0.6, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center justify-center z-10"
                      >
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-1">
                          {analysis.isStabilized ? 'Confirmed Key' : 'Analyzing...'}
                        </span>
                        <h2 className={`text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] ${!analysis.isStabilized ? 'animate-pulse' : ''}`}>
                          {analysis.key}
                        </h2>
                        <span className="text-xl font-light text-gray-400 mt-[-2px] uppercase tracking-widest">
                          {analysis.mode}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        className="flex flex-col items-center gap-2 text-center px-6 z-10"
                      >
                         <Activity className="w-6 h-6 text-neutral-500 mb-1" />
                         <span className="text-[9px] uppercase font-mono tracking-widest leading-relaxed">
                           Awaiting Signal...
                         </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-[340px] z-20">
             <button
                onClick={() => setIsListening(!isListening)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black transition-all tracking-[0.2em] transform active:scale-95 ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                    : 'bg-white text-black shadow-xl hover:bg-neutral-200'
                }`}
              >
                {isListening ? <Mic className="w-3 h-3 animate-pulse" /> : <MicOff className="w-3 h-3" />}
                {isListening ? 'STOP' : 'START'}
              </button>
          </div>
        </div>

        {/* Right Column: Details & Intelligence */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* YT Input Section */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-2.5 h-2.5 text-indigo-400" />
                Source Input
              </div>
              <div className="flex items-center gap-1 group relative cursor-help">
                <Info className="w-2.5 h-2.5 text-neutral-600" />
                <div className="absolute bottom-full right-0 mb-2 w-52 p-2 bg-neutral-900 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="text-[8px] text-gray-400 leading-normal normal-case font-normal">
                    <strong className="text-white">Pro Tip:</strong> To scan a whole song quickly, play the video and <span className="text-indigo-400">scrub through the timeline</span>. The engine accumulates data from all sections you hear.
                  </p>
                </div>
              </div>
            </h3>
            <YoutubePlayer onVideoSelect={handleVideoSelect} />
          </div>

          {/* Harmonic Analysis */}
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-4">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Harmonic Content</h3>
            
            <div className="grid grid-cols-4 gap-2">
              {NOTE_NAMES.map((note) => {
                const isActive = analysis?.key === note;
                return (
                  <div 
                    key={note}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.2)]' 
                        : 'bg-white/5 border-white/5 opacity-40'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{note}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Accuracy</span>
                <span className="text-[9px] font-mono text-indigo-400">{(analysis?.confidence ? analysis.confidence * 100 : 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Spectral</span>
                <span className="text-[8px] text-gray-600 font-mono italic">A=440Hz</span>
              </div>
              <Visualizer chroma={analysis?.chroma || new Array(12).fill(0)} />
              
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Global Memory</span>
                <button 
                  onClick={reset}
                  className="text-[8px] text-gray-500 hover:text-white transition-colors border border-white/10 px-1.5 py-0.5 rounded uppercase font-bold"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="px-8 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[8px] text-gray-500 uppercase tracking-widest z-20">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${analysis?.isStabilized ? 'bg-indigo-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>SENSORS: {analysis?.isStabilized ? 'STABILIZED' : (analysis ? 'CALIBRATING...' : 'IDLE')}</span>
          </div>
          <span>Latency: 12ms</span>
          <span>Buffer: 2048</span>
        </div>
        <div className="flex gap-4">
          <span className="text-white/20 uppercase font-bold tracking-tight">Spectral Stabilization v2.0</span>
        </div>
      </footer>
    </div>
  );
}


