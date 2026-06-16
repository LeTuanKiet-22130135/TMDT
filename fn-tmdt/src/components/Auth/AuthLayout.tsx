import React from 'react';

import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffafb1] to-[#ffffff] p-5">
      <div className="mb-6 flex flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <img src="/assets/img/logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-md" />
        <h1 className="text-3xl font-black text-[#040316] tracking-tight">{t('auth.layout.brandPrefix')}<span className="text-[#f65c88]">{t('auth.layout.brandSuffix')}</span></h1>
      </div>

      <div className="bg-[#fbfbfe] rounded-2xl shadow-xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-center text-[#040316] mb-8">{title}</h2>
        {children}
      </div>

      <div className="mt-8 text-center text-sm text-gray-600 animate-in fade-in duration-700">
        <p>{t('auth.layout.copyright', { year: new Date().getFullYear() })}</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link to="#" className="hover:text-[#f65c88] transition-colors">{t('auth.layout.terms')}</Link>
          <span className="text-gray-300">•</span>
          <Link to="#" className="hover:text-[#f65c88] transition-colors">{t('auth.layout.privacy')}</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
