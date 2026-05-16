'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { isConfigured } from '@/lib/supabase';
import { getTags, createTag, updateTag, deleteTag } from '@/lib/database';
import { Tag } from '@/types/expense';
import { alert } from '@/lib/alert';
import { IoArrowBack, IoAdd, IoCheckmarkCircle, IoClose, IoTrashOutline, IoPencilOutline, IoPricetagsOutline } from 'react-icons/io5';

const TAG_COLORS = ['#2563EB','#DC2626','#059669','#D97706','#7C3AED','#DB2777','#0891B2','#4F46E5','#EA580C','#16A34A'];

export default function TagsPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    try { setTags(await getTags()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTags(); }, []);

  const resetForm = () => { setName(''); setDescription(''); setSelectedColor(TAG_COLORS[0]); setEditingTag(null); };

  const handleSave = async () => {
    if (!name.trim()) { alert(t('common.warning'), t('tags.enterName')); return; }
    setSaving(true);
    try {
      if (editingTag) await updateTag(editingTag.id, { name: name.trim(), description: description.trim() || null, color: selectedColor });
      else await createTag({ name: name.trim(), description: description.trim() || null, color: selectedColor, start_date: null, end_date: null, is_active: true });
      setShowForm(false); resetForm(); fetchTags();
    } catch (err: any) { alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (tag: Tag) => {
    alert(t('common.delete'), `${t('common.delete')} "${tag.name}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteTag(tag.id); fetchTags(); } },
    ]);
  };

  if (loading) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('tags.manageTags')}</h1>
        <button className="icon-btn" style={{ color: colors.tint }} onClick={() => { resetForm(); setShowForm(true); }}><IoAdd style={{ fontSize: 26 }} /></button>
      </div>

      <div style={{ padding: 16 }}>
        {tags.length === 0 ? (
          <div className="empty-state">
            <IoPricetagsOutline />
            <h3>{t('tags.noTags')}</h3>
            <p>{t('tags.noTagsHint')}</p>
            <button className="btn btn-primary mt-4" onClick={() => { resetForm(); setShowForm(true); }}><IoAdd /> {t('tags.addTag')}</button>
          </div>
        ) : tags.map(tag => (
          <div key={tag.id} className="card" style={{ margin: '0 0 10px', display: 'flex', overflow: 'hidden', padding: 0, cursor: 'pointer' }} onClick={() => router.push(`/tag-stats/${tag.id}`)}>
            <div style={{ width: 5, background: tag.color }} />
            <div style={{ flex: 1, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{tag.name}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="icon-btn" style={{ color: colors.tint, fontSize: 18 }} onClick={e => { e.stopPropagation(); setEditingTag(tag); setName(tag.name); setDescription(tag.description || ''); setSelectedColor(tag.color); setShowForm(true); }}><IoPencilOutline /></button>
                  <button className="icon-btn" style={{ color: colors.danger, fontSize: 18 }} onClick={e => { e.stopPropagation(); handleDelete(tag); }}><IoTrashOutline /></button>
                </div>
              </div>
              {tag.description && <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{tag.description}</p>}
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.tint, marginTop: 8, display: 'block' }}>{t('tags.viewStats')} →</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="icon-btn" onClick={() => { setShowForm(false); resetForm(); }}><IoClose /></button>
              <h2>{editingTag ? t('tags.editTag') : t('tags.addTag')}</h2>
            </div>
            <div style={{ padding: 16 }}>
              <label className="label">{t('tags.tagName')}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t('tags.tagNamePlaceholder')} autoFocus />
              <label className="label">{t('tags.tagDescription')}</label>
              <textarea className="input textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('tags.tagDescPlaceholder')} />
              <label className="label">{t('tags.tagColor')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                {TAG_COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} style={{
                    width: 36, height: 36, borderRadius: 18, background: c, border: selectedColor === c ? '3px solid #fff' : 'none',
                    boxShadow: selectedColor === c ? '0 2px 8px rgba(0,0,0,0.3)' : 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16,
                  }}>
                    {selectedColor === c && '✓'}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-full mt-4" onClick={handleSave} disabled={saving}>
                <IoCheckmarkCircle /> {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
