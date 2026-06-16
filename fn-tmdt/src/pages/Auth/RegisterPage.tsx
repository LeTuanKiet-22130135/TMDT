import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { REGISTER_MUTATION } from '../../services/graphql/auth.graphql';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';

import { useTranslation } from 'react-i18next';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: () => {
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      setErrorMsg(error.message || t('auth.register.error'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setErrorMsg(t('auth.register.termsError'));
      return;
    }
    setErrorMsg('');
    register({ variables: { email, password, fullName } });
  };

  return (
    <AuthLayout title={t('auth.register.title')}>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        <Input 
          type="text" 
          placeholder={t('auth.register.fullNamePlaceholder')} 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User size={20} />} 
          required 
        />
        <Input 
          type="email" 
          placeholder={t('auth.register.emailPlaceholder')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={20} />} 
          required 
        />
        <Input 
          type="password" 
          placeholder={t('auth.register.passwordPlaceholder')} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={20} />} 
          required 
        />
        <div className="flex items-center mb-6 mt-2">
          <input 
            type="checkbox" 
            id="terms" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-4 h-4 text-[#f65c88] border-gray-300 rounded focus:ring-[#f65c88] accent-[#f65c88] cursor-pointer"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600 select-none cursor-pointer">
            {t('auth.register.agreeTerms')} <Link to="#" className="text-[#f65c88] hover:underline">{t('auth.register.termsLink')}</Link>
          </label>
        </div>
        <Button type="submit" isLoading={loading} disabled={!acceptedTerms}>{t('auth.register.submit')}</Button>
      </form>
      <div className="text-center text-gray-500 mt-4">
        {t('auth.register.hasAccount')} <Link to="/login" className="text-[#f65c88] font-semibold hover:underline">{t('auth.register.loginNow')}</Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
