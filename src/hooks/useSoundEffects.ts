import { useCallback, useRef, useEffect } from 'react';

// Sound URLs using free sound libraries
const SOUND_URLS = {
  zoom: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  rotate: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  freeze: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
  reset: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  move: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
  select: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
};

type SoundType = keyof typeof SOUND_URLS;

export const useSoundEffects = () => {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    zoom: null,
    rotate: null,
    freeze: null,
    reset: null,
    move: null,
    select: null,
  });
  
  const lastPlayed = useRef<Record<SoundType, number>>({
    zoom: 0,
    rotate: 0,
    freeze: 0,
    reset: 0,
    move: 0,
    select: 0,
  });

  useEffect(() => {
    // Preload all sounds
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audio.preload = 'auto';
      audioRefs.current[key as SoundType] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  const playSound = useCallback((type: SoundType, debounceMs = 500) => {
    const now = Date.now();
    if (now - lastPlayed.current[type] < debounceMs) return;
    
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
      lastPlayed.current[type] = now;
    }
  }, []);

  return { playSound };
};
