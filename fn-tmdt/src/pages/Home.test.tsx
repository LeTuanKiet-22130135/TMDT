import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './Home';
import { BrowserRouter } from 'react-router-dom';

describe('Home Page', () => {
  it('renders the heading', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    expect(screen.getByText(/Trải Nghiệm Mua Sắm Thế Hệ Mới/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    expect(screen.getByText(/Đăng nhập/i)).toBeInTheDocument();
  });
});
