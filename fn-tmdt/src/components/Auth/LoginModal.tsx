import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Mail, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LOGIN_MUTATION } from '../../services/graphql/auth.graphql';
import Input from './Input';
import Button from './Button';
import { Link } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      const { accessToken } = data.login;
      localStorage.setItem('access_token', accessToken);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      setErrorMsg(error.message || t('auth.login.error'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    login({ variables: { email, password } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#fbfbfe] rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-[#040316] mb-2">{t('auth.login.title')}</h2>
          <p className="text-sm text-gray-500">Đăng nhập để tiếp tục khám phá Lumine</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg && <div className="mb-4 text-[#db2e50] text-center text-sm p-3 bg-red-50 rounded-lg">{errorMsg}</div>}
          <Input 
            type="email" 
            name="email"
            id="login-email"
            autoComplete="email"
            placeholder={t('auth.login.emailPlaceholder')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} />} 
            required 
          />
          <Input 
            type="password" 
            name="password"
            id="login-password"
            autoComplete="current-password"
            placeholder={t('auth.login.passwordPlaceholder')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={20} />} 
            required 
          />
          <div className="flex justify-end mb-6">
            <Link to="/forgot-password" onClick={onClose} className="text-sm text-[#f65c88] hover:underline font-medium">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" isLoading={loading}>{t('auth.login.submit')}</Button>
        </form>
        
        <div className="text-center text-gray-500 mt-6 text-sm">
          {t('auth.login.noAccount')} <Link to="/register" onClick={onClose} className="text-[#f65c88] font-semibold hover:underline">{t('auth.login.registerNow')}</Link>
        </div>
      </div>
    </div>
  );
};
