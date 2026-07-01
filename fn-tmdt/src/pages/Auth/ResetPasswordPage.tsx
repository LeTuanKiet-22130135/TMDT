import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthService } from '../../services/api/auth.service';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import { useTranslation } from 'react-i18next';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const otp = searchParams.get('otp');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      setErrorMsg(t('auth.resetPassword.invalidToken'));
    }
  }, [email, otp, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    if (!email || !otp) {
      setErrorMsg(t('auth.resetPassword.invalidToken'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.resetPassword.matchError'));
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(email, otp, password);
      setMsg(t('auth.resetPassword.success'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
      setErrorMsg(errorMessage || t('auth.resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.resetPassword.title')}>
      <div className="mb-6 text-sm text-gray-600 text-center">
        {t('auth.resetPassword.instruction')}
      </div>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        {msg && <div className="mb-4 text-green-600 text-center">{msg}</div>}

        <Input 
          type="password" 
          name="password"
          id="reset-password-new"
          autoComplete="new-password"
          placeholder={t('auth.resetPassword.passwordPlaceholder')} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={20} />} 
          required 
          disabled={!email}
        />
        <Input 
          type="password" 
          name="confirmPassword"
          id="reset-password-confirm"
          autoComplete="new-password"
          placeholder={t('auth.resetPassword.confirmPlaceholder')} 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock size={20} />} 
          required 
          disabled={!email}
        />
        <Button type="submit" isLoading={loading} disabled={!email}>
          {t('auth.resetPassword.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
