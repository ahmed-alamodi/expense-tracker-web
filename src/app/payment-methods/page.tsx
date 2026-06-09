'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { alert } from '@/lib/alert';
import { IoArrowBack, IoAdd, IoClose, IoCardOutline } from 'react-icons/io5';

export default function PaymentMethodsPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const { paymentMethods, addPaymentMethod, removePaymentMethod, ready } = useSettings();
  
  const [methods, setMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (ready) {
      setMethods(paymentMethods);
    }
  }, [ready, paymentMethods]);

  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    if (methods.includes(newMethod.trim())) { alert(t('common.warning'), t('settings.methodExists')); return; }
    const updated = [...methods, newMethod.trim()];
    setMethods(updated);
    await addPaymentMethod(newMethod.trim());
    setNewMethod('');
  };

  const handleRemoveMethod = async (method: string) => {
    alert(t('common.delete'), `${t('common.delete')} "${method}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        const updated = methods.filter(m => m !== method);
        setMethods(updated);
        await removePaymentMethod(method);
      }},
    ]);
  };

  if (!ready) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('settings.paymentMethods')}</h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: 16 }}>
        <div className="card" style={{ margin: '0 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <IoCardOutline style={{ fontSize: 22, color: colors.tint }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.paymentMethods')}</span>
          </div>
          {methods.map(method => (
            <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 15 }}>{method}</span>
              <button className="icon-btn" style={{ color: colors.danger, fontSize: 18 }} onClick={() => handleRemoveMethod(method)}><IoClose /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input className="input" style={{ flex: 1 }} value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder={t('settings.newPaymentMethod')} />
            <button className="btn btn-small" style={{ background: colors.success, color: '#fff' }} onClick={handleAddMethod}><IoAdd /></button>
          </div>
        </div>
      </div>
    </>
  );
}
