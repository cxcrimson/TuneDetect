import { motion } from 'motion/react';
import { NOTE_NAMES } from '../lib/theory';

interface VisualizerProps {
  chroma: number[];
}

export function Visualizer({ chroma }: VisualizerProps) {
  const maxVal = Math.max(...chroma, 0.001);

  return (
    <div className="flex items-end justify-between gap-1 h-32 w-full bg-white/[0.02] border border-white/5 rounded-lg p-4 overflow-hidden">
      {chroma.map((value, i) => (
        <div key={i} className="flex flex-col items-center flex-1 h-full gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(value / maxVal) * 100}%` }}
            className="w-full bg-indigo-500/50 rounded-t-sm"
            style={{
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
              background: `linear-gradient(to top, rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.8))`
            }}
          />
          <span className="text-[8px] font-mono text-gray-600 uppercase">
            {NOTE_NAMES[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
