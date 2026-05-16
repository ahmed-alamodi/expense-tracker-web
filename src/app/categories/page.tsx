'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { CategoryGroup } from '@/types/expense';
import { alert } from '@/lib/alert';
import { IoArrowBack, IoAdd, IoCheckmark, IoClose, IoTrashOutline, IoPencilOutline } from 'react-icons/io5';

export default function CategoriesPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const { categories: settingsCategories, updateCategories } = useSettings();
  const [categories, setLocalCategories] = useState<CategoryGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddMain, setShowAddMain] = useState(false);
  const [newMainName, setNewMainName] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');

  useEffect(() => { setLocalCategories(settingsCategories); }, [settingsCategories]);

  const persist = async (updated: CategoryGroup[]) => {
    setSaving(true);
    try { await updateCategories(updated); setLocalCategories(updated); } finally { setSaving(false); }
  };

  const handleAddMain = async () => {
    const name = newMainName.trim();
    if (!name) return;
    if (categories.some(c => c.main === name)) { alert(t('common.warning'), t('categories.categoryExists')); return; }
    await persist([...categories, { main: name, subs: [] }]);
    setNewMainName(''); setShowAddMain(false);
  };

  const handleDeleteMain = (idx: number) => {
    const cat = categories[idx];
    alert(t('categories.deleteCategory'), `${t('common.delete')} "${cat.main}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => persist(categories.filter((_, i) => i !== idx)) },
    ]);
  };

  const handleAddSub = async () => {
    if (selectedIdx === null) return;
    const name = newSubName.trim();
    if (!name) return;
    const cat = categories[selectedIdx];
    if (cat.subs.includes(name)) { alert(t('common.warning'), t('categories.subCategoryExists')); return; }
    const updated = categories.map((c, i) => i === selectedIdx ? { ...c, subs: [...c.subs, name] } : c);
    await persist(updated);
    setNewSubName('');
  };

  const handleDeleteSub = async (mainIdx: number, subIdx: number) => {
    const updated = categories.map((c, i) => i === mainIdx ? { ...c, subs: c.subs.filter((_, si) => si !== subIdx) } : c);
    await persist(updated);
  };

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('categories.manageCategories')}</h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: 16 }}>
        {showAddMain ? (
          <div className="card" style={{ margin: 0, marginBottom: 12, borderColor: colors.tint }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t('categories.newMainCategory')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} value={newMainName} onChange={e => setNewMainName(e.target.value)} placeholder={t('categories.categoryName')} autoFocus />
              <button className="btn btn-small" style={{ background: colors.success, color: '#fff' }} onClick={handleAddMain} disabled={saving}><IoCheckmark /></button>
              <button className="btn btn-small" style={{ background: colors.border }} onClick={() => { setShowAddMain(false); setNewMainName(''); }}><IoClose /></button>
            </div>
          </div>
        ) : (
          <button className="btn btn-outline btn-full mb-3" style={{ borderStyle: 'dashed', borderColor: colors.tint, color: colors.tint }} onClick={() => setShowAddMain(true)}>
            <IoAdd /> {t('categories.addMainCategory')}
          </button>
        )}

        {categories.map((cat, idx) => (
          <div key={`${cat.main}-${idx}`} className="card" style={{ margin: '0 0 10px', overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{cat.main}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{cat.subs.length} {t('categories.subCategory')}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="icon-btn" style={{ color: colors.danger, fontSize: 18 }} onClick={() => handleDeleteMain(idx)}><IoTrashOutline /></button>
              </div>
            </div>
            {cat.subs.map((sub, subIdx) => (
              <div key={subIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 14, color: colors.textSecondary }}>› {sub}</span>
                <button className="icon-btn" style={{ color: colors.danger, fontSize: 15 }} onClick={() => handleDeleteSub(idx, subIdx)}><IoClose /></button>
              </div>
            ))}
            <button style={{ width: '100%', padding: 10, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.tint, fontSize: 13, fontFamily: 'inherit' }}
              onClick={() => { setSelectedIdx(idx); setShowSubModal(true); setNewSubName(''); }}>
              <IoAdd /> {t('categories.addSubCategory')}
            </button>
          </div>
        ))}
      </div>

      {/* Sub Category Modal */}
      {showSubModal && selectedIdx !== null && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="icon-btn" onClick={() => setShowSubModal(false)}><IoClose /></button>
              <h2>{t('categories.categoriesOf')} &quot;{categories[selectedIdx]?.main}&quot;</h2>
            </div>
            <div style={{ padding: 16 }}>
              {categories[selectedIdx]?.subs.map((sub, subIdx) => (
                <div key={subIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: 15 }}>{sub}</span>
                  <button className="icon-btn" style={{ color: colors.danger, fontSize: 16 }} onClick={() => handleDeleteSub(selectedIdx, subIdx)}><IoTrashOutline /></button>
                </div>
              ))}
              <label className="label" style={{ marginTop: 16 }}>{t('categories.addNewSubCategory')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" style={{ flex: 1 }} value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder={t('categories.subCategoryName')} />
                <button className="btn btn-small" style={{ background: colors.success, color: '#fff' }} onClick={handleAddSub} disabled={saving || !newSubName.trim()}><IoAdd /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
