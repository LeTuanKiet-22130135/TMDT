import React from 'react';

interface SparkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SparkButton: React.FC<SparkButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button 
      className={`
        bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] 
        bg-[length:200%_auto] hover:animate-gradient
        transition-transform duration-300 ease-in-out
        text-white rounded-full py-3 px-4 text-xs font-bold shadow-md
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
