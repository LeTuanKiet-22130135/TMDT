import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../Home';
import { useHomeData } from '../home.logic';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../home.logic', () => ({
  useHomeData: vi.fn(),
}));

vi.mock('react-responsive-masonry', () => ({
  default: ({ children }: any) => <div>{children}</div>,
  ResponsiveMasonry: ({ children }: any) => <div>{children}</div>,
}));


describe('Home Page', () => {
  it('nên render đúng tiêu đề và danh sách tài nguyên', () => {
    const mockAssets = [
      {
        id: "1",
        title: "Test Asset 1",
        author: "Test Author",
        authorHandle: "@testauthor",
        authorAvatar: "http://test.com/avatar.jpg",
        authorFollowers: "1k",
        category: "Test Category",
        price: 99,
        imageUrl: "http://test.com/img.jpg",
        images: ["http://test.com/img.jpg"],
        imageAlt: "Test Alt",
        tags: ["TAG1"],
        rating: 4.5,
        reviewsCount: 10,
        description: "Test description"
      }
    ];
    
    (useHomeData as any).mockReturnValue({ assets: mockAssets });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Bộ sưu tập tuần')).toBeInTheDocument();
    expect(screen.getByText('Test Asset 1')).toBeInTheDocument();
    expect(screen.getByText('99 VND')).toBeInTheDocument();
  });
});
