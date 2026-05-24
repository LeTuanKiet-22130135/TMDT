import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../Home';
import { useHomeData } from '../home.logic';

// Mock logic
vi.mock('../home.logic', () => ({
  useHomeData: vi.fn(),
}));

describe('Home Page', () => {
  it('nên render đúng tiêu đề và danh sách tài nguyên', () => {
    const mockAssets = [
      {
        id: "1",
        title: "Test Asset 1",
        author: "Test Author",
        category: "Test Category",
        price: 99,
        imageUrl: "http://test.com/img.jpg",
        imageAlt: "Test Alt"
      }
    ];
    
    (useHomeData as any).mockReturnValue({ assets: mockAssets });

    render(<Home />);

    expect(screen.getByText('Bộ sưu tập tuần')).toBeInTheDocument();
    expect(screen.getByText('Test Asset 1')).toBeInTheDocument();
    expect(screen.getByText(/Bởi Test Author • Test Category/i)).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });
});
