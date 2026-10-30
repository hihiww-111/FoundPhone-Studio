import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { safeMedia, type Item } from "./schema";

type Playback = {
  song: Item | null;
  playing: boolean;
  play: (song: Item, queue: Item[]) => void;
  toggle: () => void;
  next: () => void;
};
const MusicPlaybackContext = createContext<Playback | null>(null);

// Owned by the phone, so App navigation never removes the audio element.
export function MusicPlaybackProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const queue = useRef<Item[]>([]);
  const current = useRef<Item | null>(null);
  const [song, setSong] = useState<Item | null>(null);
  const [playing, setPlaying] = useState(false);
  const request = useRef(0);
  const start = () => {
    const element = audio.current;
    if (!element || !element.getAttribute("src")) return;
    const id = ++request.current;
    void element.play().catch(() => {
      if (id === request.current) setPlaying(false);
    });
  };
  const play = (item: Item, songs: Item[]) => {
    current.current = item;
    queue.current = songs;
    setSong(item);
    setPlaying(false);
    ++request.current;
    const element = audio.current;
    if (!element) return;
    element.pause();
    const source = item.kind === "audio" ? safeMedia(item.media) : "";
    if (!source) {
      element.removeAttribute("src");
      element.load();
      return;
    }
    element.src = source;
    // Invoke play inside the tap handler to preserve Safari's user activation.
    start();
  };
  const next = () => {
    const songs = queue.current;
    if (!songs.length || !current.current) return;
    const index = songs.findIndex((item) => item.id === current.current?.id);
    play(songs[(index + 1) % songs.length], songs);
  };
  const toggle = () => {
    if (!audio.current) return;
    if (audio.current.paused) start();
    else {
      ++request.current;
      audio.current.pause();
    }
  };
  return (
    <MusicPlaybackContext.Provider value={{ song, playing, play, toggle, next }}>
      {children}
      <audio
        ref={audio}
        data-music-playback
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setPlaying(false)}
        onEnded={next}
      />
    </MusicPlaybackContext.Provider>
  );
}

export function useMusicPlayback() {
  const playback = useContext(MusicPlaybackContext);
  if (!playback) throw new Error("Music playback requires a phone provider");
  return playback;
}
