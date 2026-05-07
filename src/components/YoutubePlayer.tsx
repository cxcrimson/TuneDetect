import { useState } from 'react';
import YouTube from 'react-youtube';
import { Search, Youtube } from 'lucide-react';

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

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Analyze
        </button>
      </form>

      {videoId && (
        <div className="aspect-video rounded-lg overflow-hidden border border-neutral-800">
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 0,
              },
            }}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
