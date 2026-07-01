import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { AuthService } from '../../services/api/auth.service';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import { useTranslation } from 'react-i18next';

const VerifyResetOtpPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otp.length !== 6) {
      setErrorMsg(t('auth.verifyResetOtp.error'));
      return;
    }

    if (!email) return;

    setLoading(true);
    try {
      await AuthService.verifyResetOtp(email, otp);
      // Navigate to reset password page with email and otp
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
      setErrorMsg(errorMessage || "Xác thực thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.verifyResetOtp.title')}>
      <div className="mb-6 text-sm text-gray-600 text-center">
        {t('auth.verifyResetOtp.instruction')}
      </div>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        
        <Input 
          type="text" 
          name="otp"
          id="verify-reset-otp"
          autoComplete="one-time-code"
          placeholder={t('auth.verifyResetOtp.otpPlaceholder')} 
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          icon={<KeyRound size={20} />} 
          required 
          disabled={!email}
        />
        
        <Button type="submit" disabled={!email || loading} isLoading={loading}>
          {t('auth.verifyResetOtp.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default VerifyResetOtpPage;
