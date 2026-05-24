import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpriteSheetProps {
  frameCount: number;
  fps: number;
  autoPlay: boolean;
  loop: boolean;
}

export function useSpriteSheet({
  frameCount,
  fps,
  autoPlay,
  loop,
}: UseSpriteSheetProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLooping, setIsLooping] = useState(loop);
  const timerRef = useRef<number | null>(null);

  const play = useCallback(() => setIsPlaying(true), []);
  const stop = useCallback(() => setIsPlaying(false), []);
  const setLoop = useCallback((value: boolean) => setIsLooping(value), []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => {
          const nextFrame = prev + 1;
          if (nextFrame >= frameCount) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return nextFrame;
        });
      }, 1000 / fps);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, fps, frameCount, isLooping]);

  return {
    currentFrame,
    play,
    stop,
    setLoop,
  };
}
