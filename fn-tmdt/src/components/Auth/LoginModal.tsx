import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Mail, Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LOGIN_MUTATION } from '../../services/graphql/auth.graphql';
import Input from './Input';
import Button from './Button';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { AuthService } from '../../services/api/auth.service';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import _FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const FacebookLogin = (_FacebookLogin as any).default || _FacebookLogin;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { notifyLogin } = useUserProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      const { accessToken } = data.login;
      localStorage.setItem('access_token', accessToken);
      notifyLogin();
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const data = await AuthService.loginWithGoogle(credentialResponse.credential);
      localStorage.setItem('access_token', data.access_token);
      notifyLogin();
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || t('auth.login.error'));
    }
  };

  const handleFacebookSuccess = async (response: any) => {
    if (response.accessToken) {
      try {
        const data = await AuthService.loginWithFacebook(response.accessToken);
        localStorage.setItem('access_token', data.access_token);
        notifyLogin();
        onSuccess();
        onClose();
      } catch (error: any) {
        setErrorMsg(error.response?.data?.detail || t('auth.login.error'));
      }
    }
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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#fbfbfe] text-gray-500">Or continue with</span>
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
              callback={handleFacebookSuccess}
              fields="name,email,picture"
              render={(renderProps: any) => (
                <button
                  type="button"
                  onClick={renderProps.onClick}
                  disabled={renderProps.isDisabled}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors h-10"
                >
                  <img className="h-5 w-5 mr-2" src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook logo" />
                  Sign in with Facebook
                </button>
              )}
            />
          </div>
        </div>
        
        <div className="text-center text-gray-500 mt-6 text-sm">
          {t('auth.login.noAccount')} <Link to="/register" onClick={onClose} className="text-[#f65c88] font-semibold hover:underline">{t('auth.login.registerNow')}</Link>
        </div>
      </div>
    </div>
  );
};
