'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { isConfigured } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { alert } from '@/lib/alert';
import { IoWallet, IoCloudOfflineOutline } from 'react-icons/io5';

export default function AuthPage() {
  const colors = useThemeColor();
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isConfigured) {
    return (
      <div className="auth-container" style={{ alignItems: 'center', textAlign: 'center' }}>
        <IoCloudOfflineOutline style={{ fontSize: 64, color: colors.textSecondary }} />
        <h2 style={{ marginTop: 16 }}>{t('auth.supabaseNotConfigured')}</h2>
        <p style={{ color: colors.textSecondary, marginTop: 8 }}>{t('auth.supabaseSetupGuide')}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert(t('common.warning'), t('auth.enterCredentials'));
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      alert(t('common.warning'), t('auth.passwordMismatch'));
      return;
    }
    if (!isLogin && password.length < 6) {
      alert(t('common.warning'), t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) alert(t('common.error'), error.message);
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) alert(t('common.error'), error.message);
        else alert(t('auth.registered'), t('auth.registeredMsg'));
      }
    } catch (err: any) {
      alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-icon-circle"><IoWallet /></div>
        <h1 className="auth-title">{t('auth.appName')}</h1>
        <p className="auth-subtitle">{t('auth.appTagline')}</p>
      </div>

      <div className="segmented" style={{ marginBottom: 20 }}>
        <button className={`segmented-btn ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
          {t('auth.login')}
        </button>
        <button className={`segmented-btn ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
          {t('auth.signup')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ margin: 0 }}>
        <label className="label">{t('auth.email')}</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" autoComplete="email" />

        <label className="label">{t('auth.password')}</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        {!isLogin && (
          <>
            <label className="label">{t('auth.confirmPassword')}</label>
            <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </>
        )}

        <button type="submit" className="btn btn-primary btn-full mt-4" disabled={loading}>
          {loading ? '...' : isLogin ? t('auth.login') : t('auth.createAccount')}
        </button>
      </form>
    </div>
  );
}
