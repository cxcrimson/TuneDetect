import { useState } from 'react';
import { Search, Youtube, ExternalLink, Play } from 'lucide-react';

interface YoutubePlayerProps {
  onVideoSelect: (videoId: string) => void;
}

export function YoutubePlayer({ onVideoSelect }: YoutubePlayerProps) {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);

  const extractVideoId = (input: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      onVideoSelect(id);
    }
  };

  const openYoutube = () => {
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search or paste Youtube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          LOAD
        </button>
      </form>

      {videoId && (
        <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/40">
           <img 
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
              className="w-full h-32 object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              alt="Thumbnail"
           />
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <button 
                onClick={openYoutube}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-full transition-all transform hover:scale-110 border border-white/20"
              >
                <Play className="w-6 h-6 text-white fill-white" />
              </button>
              <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/5">
                <ExternalLink className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white font-bold tracking-tight uppercase">Open in Youtube to Analysis</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
