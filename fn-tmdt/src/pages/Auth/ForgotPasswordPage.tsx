import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthService } from '../../services/api/auth.service';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import { useTranslation } from 'react-i18next';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
      setErrorMsg(errorMessage || t('auth.forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.forgotPassword.title')}>
      <div className="mb-6 text-sm text-gray-600 text-center">
        {t('auth.forgotPassword.instruction')}
      </div>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        {msg && <div className="mb-4 text-green-600 text-center">{msg}</div>}
        <Input 
          type="email" 
          name="email"
          id="forgot-password-email"
          autoComplete="email"
          placeholder={t('auth.forgotPassword.emailPlaceholder')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={20} />} 
          required 
        />
        <Button type="submit" isLoading={loading}>{t('auth.forgotPassword.submit')}</Button>
      </form>

      <div className="text-center text-gray-500 mt-6">
        <Link to="/login" className="text-[#f65c88] font-semibold hover:underline">
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
