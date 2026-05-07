import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Music, Settings, Activity, Search } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizer';
import { YoutubePlayer } from './components/YoutubePlayer';
import { NOTE_NAMES } from './lib/theory';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const { analysis, reset } = useAudioAnalyzer(isListening);

  const handleVideoSelect = () => {
    reset(); // Clear old spectral data when song changes
    if (!isListening) setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e0] font-sans flex flex-col overflow-x-hidden relative">
      {/* Atmospheric Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5] opacity-10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ec4899] opacity-10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="flex items-center justify-between px-12 py-6 z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            TuneDetect Pro
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-neutral-700'}`} />
            <span className={`text-[10px] font-bold tracking-widest uppercase ${isListening ? 'text-emerald-500' : 'text-neutral-500'}`}>
              {isListening ? 'Live Analysis' : 'Engine Idle'}
            </span>
          </div>
          {analysis && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Song Memory Active</span>
            </div>
          )}
          <button className="px-4 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all text-[10px] font-bold uppercase tracking-widest">
            Settings
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row px-12 py-10 gap-10 z-10">
        {/* Left Column: Primary Key Display */}
        <div className="flex-[1.2] flex flex-col justify-center items-center relative min-h-[500px]">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Background Decorative Rings */}
            <div className="w-[440px] h-[440px] border border-dashed border-white/5 rounded-full opacity-30 animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-[400px] h-[400px] rounded-full border-[1px] border-white/5 flex items-center justify-center">
              <div className="w-[320px] h-[320px] rounded-full border-[1px] border-indigo-500/20 flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.05)]">
                <div className="w-[240px] h-[240px] rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex flex-col items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    {analysis ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-2">Detected Key</span>
                        <h2 className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                          {analysis.key}
                        </h2>
                        <span className="text-2xl font-light text-gray-400 mt-[-5px] uppercase tracking-widest">
                          {analysis.mode}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        className="flex flex-col items-center gap-4 text-center px-8"
                      >
                         <Activity className="w-8 h-8 text-neutral-500 mb-2" />
                         <span className="text-[10px] uppercase font-mono tracking-widest leading-relaxed">
                           {isListening ? 'Awaiting Audio Signal...' : 'System Latent – Start Sensors'}
                         </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls Hooked to Main Ring */}
          <div className="mt-[420px] z-20">
             <button
                onClick={() => setIsListening(!isListening)}
                className={`flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black transition-all tracking-[0.2em] transform active:scale-95 ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                    : 'bg-white text-black shadow-xl hover:bg-neutral-200'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                {isListening ? 'KILL SENSOR' : 'ENGAGE SENSOR'}
              </button>
          </div>
        </div>

        {/* Right Column: Details & Intelligence */}
        <div className="flex-1 flex flex-col gap-8">
          {/* YT Input Section */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Search className="w-3 h-3 text-indigo-400" />
              Source Input
            </h3>
            <YoutubePlayer onVideoSelect={handleVideoSelect} />
            
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Signal Controls</h4>
                <button 
                  onClick={reset}
                  className="text-[9px] text-gray-500 hover:text-white transition-colors border border-white/10 px-2 py-1 rounded"
                >
                  RESET ENGINE
                </button>
              </div>
              <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Audio Source</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                The engine is now configured for <span className="text-gray-300">Internal Tab Capture</span>. 
              </p>
              <div className="mt-2 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                <p className="text-[9px] text-indigo-300/80 leading-snug italic">
                  Run as a Chrome Extension to intercept digital audio directly from YouTube with zero interference.
                </p>
              </div>
            </div>
          </div>

          {/* Harmonic Analysis */}
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Harmonic Content</h3>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
              {NOTE_NAMES.map((note) => {
                const isActive = analysis?.key === note;
                return (
                  <div 
                    key={note}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
                        : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{note}</span>
                    <span className="text-[8px] text-indigo-400/60 uppercase font-mono">{isActive ? 'ROOT' : ''}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Confidence</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-indigo-400">{(analysis?.confidence ? analysis.confidence * 100 : 0).toFixed(1)}%</span>
                  <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(analysis?.confidence || 0) * 100}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Spectral View</span>
                <span className="text-[10px] text-gray-600 font-mono">Standard A=440Hz</span>
              </div>
              <Visualizer chroma={analysis?.chroma || new Array(12).fill(0)} />
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              Export Signal
            </button>
            <button className="p-4 rounded-xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors">
              Add to Lib
            </button>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="px-12 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 uppercase tracking-widest z-20">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-neutral-800'}`} />
            SENSORS: {isListening ? 'LIVE' : 'IDLE'}
          </span>
          <span>Buffer: 512 samples</span>
          <span>Latency: 12ms</span>
        </div>
        <div className="flex gap-4">
          <span className="text-white/20">TuneDetect Engine v2.4.0</span>
        </div>
      </footer>
    </div>
  );
}


