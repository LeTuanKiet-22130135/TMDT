import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { VERIFY_OTP_MUTATION } from '../../services/graphql/auth.graphql';
import AuthLayout from '../../components/Auth/AuthLayout';
import Button from '../../components/Auth/Button';

import { useTranslation } from 'react-i18next';

const VerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { loading }] = useMutation(VERIFY_OTP_MUTATION, {
    onCompleted: (data: any) => {
      if (data.verifyOtp) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || t('auth.verify.error'));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(val => val !== '') && newOtp.length === 6) {
      verifyOtp({ variables: { email, otp: newOtp.join('') } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (pasteData.length === 0) return;

    const newOtp = [...otpArray];
    pasteData.forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtpArray(newOtp);

    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasteData.length === 6) {
      verifyOtp({ variables: { email, otp: pasteData.join('') } });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const otp = otpArray.join('');
    if (otp.length !== 6) {
      setErrorMsg(t('auth.verify.lengthError'));
      return;
    }
    verifyOtp({ variables: { email, otp } });
  };

  if (isSuccess) {
    return (
      <AuthLayout title={t('auth.verify.successTitle')}>
        <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-300">
          <CheckCircle className="text-green-500 w-20 h-20 mb-6 drop-shadow-md" />
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {t('auth.verify.successMessage')}
          </p>
          <Button onClick={() => navigate('/login')}>{t('auth.verify.toLogin')}</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.verify.title')}>
      <div className="text-center text-gray-600 mb-6">
        {t('auth.verify.instruction')} <br/>
        <strong className="text-[#040316]">{email}</strong>
      </div>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        
        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
          {otpArray.map((value, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              ref={el => { inputRefs.current[index] = el; }}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:border-[#f65c88] focus:ring-2 focus:ring-[#f65c88] focus:ring-opacity-20 outline-none transition-all duration-200 shadow-sm"
            />
          ))}
        </div>

        <Button type="submit" isLoading={loading}>{t('auth.verify.submit')}</Button>
      </form>
    </AuthLayout>
  );
};

export default VerificationPage;
