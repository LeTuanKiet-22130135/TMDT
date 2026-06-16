import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { LOGIN_MUTATION } from '../../services/graphql/auth.graphql';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';

import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      const { accessToken } = data.login;
      localStorage.setItem('access_token', accessToken);
      navigate('/');
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

  return (
    <AuthLayout title={t('auth.login.title')}>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        <Input 
          type="email" 
          placeholder={t('auth.login.emailPlaceholder')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={20} />} 
          required 
        />
        <Input 
          type="password" 
          placeholder={t('auth.login.passwordPlaceholder')} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={20} />} 
          required 
        />
        <div className="flex justify-end mb-4">
          <Link to="/forgot-password" className="text-sm text-[#f65c88] hover:underline">{t('auth.login.forgotPassword')}</Link>
        </div>
        <Button type="submit" isLoading={loading}>{t('auth.login.submit')}</Button>
      </form>
      <div className="text-center text-gray-500 mt-4">
        {t('auth.login.noAccount')} <Link to="/register" className="text-[#f65c88] font-semibold hover:underline">{t('auth.login.registerNow')}</Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
