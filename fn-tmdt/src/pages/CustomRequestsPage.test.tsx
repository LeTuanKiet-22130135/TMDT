import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CustomRequestsPage from './CustomRequestsPage';
import { BrowserRouter } from 'react-router-dom';

describe('CustomRequestsPage', () => {
  it('nên hiển thị danh sách chat, ticket code và cho phép chuyển đổi liên hệ', () => {
    render(
      <BrowserRouter>
        <CustomRequestsPage />
      </BrowserRouter>
    );

    // Kiểm tra danh sách liên hệ có đúng tên và ticket
    expect(screen.getByText('Elena V.')).toBeInTheDocument();
    expect(screen.getByText('Studio Arid')).toBeInTheDocument();
    expect(screen.getByText('TICKET: #DEKO0132')).toBeInTheDocument();

    // Chuyển sang Studio Arid
    const aridBtn = screen.getByRole('button', { name: /Studio Arid/i });
    fireEvent.click(aridBtn);
    expect(screen.getByText('TICKET: #ARID0099')).toBeInTheDocument();
  });

  it('nên cho phép người dùng nhập tin nhắn chat', () => {
    render(
      <BrowserRouter>
        <CustomRequestsPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Gửi tin nhắn tới Elena V\./i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Chào Elena, dự án của chúng ta thế nào rồi?' } });
    expect(input).toHaveValue('Chào Elena, dự án của chúng ta thế nào rồi?');
  });
});
