import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative mb-5">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`w-full bg-white border border-gray-200 text-[#040316] rounded-xl py-4 pr-5 focus:outline-none focus:ring-2 focus:ring-[#f65c88] focus:border-transparent transition-all ${icon ? 'pl-12' : 'pl-5'} ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
