import { forwardRef, useImperativeHandle } from 'react';
import { useSpriteSheet } from './SpriteSheetDisplay.logic';

export interface SpriteSheetProps {
  /** Đường dẫn đến ảnh sprite sheet */
  src: string;
  /** Chiều rộng của 1 khung hình (px) */
  frameWidth: number;
  /** Chiều cao của 1 khung hình (px) */
  frameHeight: number;
  /** Tổng số khung hình */
  frameCount: number;
  /** Số khung hình trên giây (mặc định 24) */
  fps?: number;
  /** Số cột trong sprite sheet (nếu không truyền sẽ mặc định bằng frameCount tức là 1 hàng ngang) */
  columns?: number;
  /** Class tùy chỉnh */
  className?: string;
  /** Tự động chạy khi render */
  autoPlay?: boolean;
  /** Lặp lại animation */
  loop?: boolean;
}

export interface SpriteSheetRef {
  play: () => void;
  stop: () => void;
  setLoop: (loop: boolean) => void;
}

/**
 * Hiển thị và điều khiển Sprite Sheet
 */
export const SpriteSheetDisplay = forwardRef<SpriteSheetRef, SpriteSheetProps>(
  (
    {
      src,
      frameWidth,
      frameHeight,
      frameCount,
      fps = 24,
      columns,
      className = '',
      autoPlay = false,
      loop = false,
    },
    ref
  ) => {
    const { currentFrame, play, stop, setLoop } = useSpriteSheet({
      frameCount,
      fps,
      autoPlay,
      loop,
    });

    const cols = columns || frameCount;

    useImperativeHandle(ref, () => ({
      play,
      stop,
      setLoop,
    }));

    const row = Math.floor(currentFrame / cols);
    const col = currentFrame % cols;

    const backgroundPosition = `-${col * frameWidth}px -${row * frameHeight}px`;

    return (
      <div
        className={`inline-block ${className}`}
        style={{
          width: `${frameWidth}px`,
          height: `${frameHeight}px`,
          backgroundImage: `url(${src})`,
          backgroundPosition,
          backgroundRepeat: 'no-repeat',
        }}
        role="img"
        aria-label="Sprite animation"
      />
    );
  }
);

SpriteSheetDisplay.displayName = 'SpriteSheetDisplay';
