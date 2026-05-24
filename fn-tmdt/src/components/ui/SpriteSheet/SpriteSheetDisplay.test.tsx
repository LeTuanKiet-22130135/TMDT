import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpriteSheetDisplay, type SpriteSheetRef } from './SpriteSheetDisplay';
import React, { createRef } from 'react';

describe('SpriteSheetDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('hiển thị chính xác với các props mặc định', () => {
    render(
      <SpriteSheetDisplay
        src="test.png"
        frameWidth={100}
        frameHeight={100}
        frameCount={5}
      />
    );
    const div = screen.getByRole('img', { name: 'Sprite animation' });
    expect(div).toBeInTheDocument();
    expect(div).toHaveStyle({
      width: '100px',
      height: '100px',
      backgroundImage: 'url(test.png)',
      backgroundPosition: '-0px -0px',
    });
  });

  it('chạy animation khi hàm play được gọi', () => {
    const ref = createRef<SpriteSheetRef>();
    render(
      <SpriteSheetDisplay
        ref={ref}
        src="test.png"
        frameWidth={100}
        frameHeight={100}
        frameCount={5}
        fps={1}
      />
    );

    const div = screen.getByRole('img', { name: 'Sprite animation' });
    expect(div).toHaveStyle({ backgroundPosition: '-0px -0px' });

    act(() => {
      ref.current?.play();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(div).toHaveStyle({ backgroundPosition: '-100px -0px' });
  });

  it('dừng animation khi hàm stop được gọi', () => {
    const ref = createRef<SpriteSheetRef>();
    render(
      <SpriteSheetDisplay
        ref={ref}
        src="test.png"
        frameWidth={100}
        frameHeight={100}
        frameCount={5}
        fps={1}
      />
    );

    const div = screen.getByRole('img', { name: 'Sprite animation' });

    act(() => {
      ref.current?.play();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(div).toHaveStyle({ backgroundPosition: '-100px -0px' });

    act(() => {
      ref.current?.stop();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Vẫn ở frame cũ
    expect(div).toHaveStyle({ backgroundPosition: '-100px -0px' });
  });

  it('tự động chạy khi autoPlay là true', () => {
    render(
      <SpriteSheetDisplay
        src="test.png"
        frameWidth={100}
        frameHeight={100}
        frameCount={5}
        fps={1}
        autoPlay
      />
    );

    const div = screen.getByRole('img', { name: 'Sprite animation' });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(div).toHaveStyle({ backgroundPosition: '-100px -0px' });
  });
});
