import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading, className = '', ...props }) => {
  return (
    <button
      className={`w-full bg-gradient-to-r from-[#ff9fb1] to-[#db2e50] text-white font-semibold rounded-xl py-4 px-6 hover:shadow-lg hover:opacity-90 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-5 ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Đang xử lý...' : children}
    </button>
  );
};

export default Button;
