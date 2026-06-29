import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthService } from '../../services/api/auth.service';
import AuthLayout from '../../components/Auth/AuthLayout';
import Input from '../../components/Auth/Input';
import Button from '../../components/Auth/Button';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import _FB from '@greatsumini/react-facebook-login';
const FacebookLogin = (_FB as any).default ?? _FB;
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '../../contexts/UserProfileContext';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notifyLogin } = useUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const data = await AuthService.login({ email, password });
      localStorage.setItem('access_token', data.access_token);
      notifyLogin();
      navigate('/');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
      setErrorMsg(msg || t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const data = await AuthService.loginWithGoogle(credentialResponse.credential);
      localStorage.setItem('access_token', data.access_token);
      notifyLogin();
      navigate('/');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
      setErrorMsg(msg || t('auth.login.error'));
    }
  };

  const handleFacebookSuccess = async (response: any) => {
    if (response.accessToken) {
      try {
        const data = await AuthService.loginWithFacebook(response.accessToken);
        localStorage.setItem('access_token', data.access_token);
        notifyLogin();
        navigate('/');
      } catch (error: any) {
        const detail = error.response?.data?.detail;
        const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail;
        setErrorMsg(msg || t('auth.login.error'));
      }
    }
  };

  return (
    <AuthLayout title={t('auth.login.title')}>
      <form onSubmit={handleSubmit}>
        {errorMsg && <div className="mb-4 text-[#db2e50] text-center">{errorMsg}</div>}
        <Input 
          type="email" 
          name="email"
          id="login-page-email"
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
          id="login-page-password"
          autoComplete="current-password"
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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#FBFBFE] text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-3">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
            <div className="flex justify-center w-full [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg(t('auth.login.error'))}
                theme="outline"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>
          </GoogleOAuthProvider>

          <FacebookLogin
            appId={import.meta.env.VITE_FACEBOOK_CLIENT_ID || ''}
            onSuccess={handleFacebookSuccess}
            render={({ onClick }: { onClick?: () => void }) => (
              <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors h-10"
              >
                <img className="h-5 w-5 mr-2" src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook logo" />
                Sign in with Facebook
              </button>
            )}
          />
        </div>
      </div>

      <div className="text-center text-gray-500 mt-6">
        {t('auth.login.noAccount')} <Link to="/register" className="text-[#f65c88] font-semibold hover:underline">{t('auth.login.registerNow')}</Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
