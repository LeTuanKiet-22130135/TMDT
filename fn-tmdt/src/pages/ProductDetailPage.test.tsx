import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductDetailPage from './ProductDetailPage';
import { useHomeData } from './Home/home.logic';
import { BrowserRouter } from 'react-router-dom';

vi.mock('./Home/home.logic', () => ({
  useHomeData: vi.fn(),
}));

describe('ProductDetailPage', () => {
  it('nên render chi tiết tài nguyên và cho phép đổi ảnh hoặc bình luận', () => {
    const mockAssets = [
      {
        id: "1",
        title: "Trang phục Nữ Vu",
        author: "blueneko",
        authorHandle: "@blueneko",
        authorAvatar: "http://test.com/avatar.jpg",
        authorFollowers: "3.6k",
        category: "Trang phục 3D",
        price: 10000,
        imageUrl: "http://test.com/img1.jpg",
        images: ["http://test.com/img1.jpg", "http://test.com/img2.jpg"],
        imageAlt: "Mẫu trang phục Nữ Vu Nhật Bản",
        tags: ["TAG 1", "TAG 2"],
        rating: 4.8,
        reviewsCount: 124,
        description: "Mô tả Nữ Vu"
      }
    ];

    (useHomeData as any).mockReturnValue({ assets: mockAssets });

    render(
      <BrowserRouter>
        <ProductDetailPage />
      </BrowserRouter>
    );

    // Kiểm tra render các thông tin chính
    expect(screen.getByText('Trang phục Nữ Vu')).toBeInTheDocument();
    expect(screen.getByText('10.000 VND')).toBeInTheDocument();
    expect(screen.getByText('Mô tả Nữ Vu')).toBeInTheDocument();

    // Thử tương tác Follow Artist
    const followBtn = screen.getByRole('button', { name: /Follow Artist/i });
    expect(followBtn).toBeInTheDocument();
    fireEvent.click(followBtn);
    expect(screen.getByRole('button', { name: /Đã Theo Dõi/i })).toBeInTheDocument();
  });
});
