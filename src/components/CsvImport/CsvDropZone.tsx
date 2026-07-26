'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCloudUploadOutline } from 'react-icons/io5';
import styles from './CsvImport.module.css';

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function CsvDropZone({ onFileSelected, disabled }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }, [disabled, onFileSelected]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    // Reset input so re-uploading the same file works
    e.target.value = '';
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={t('import.dropZoneLabel')}
    >
      <div className={styles.dropZoneIcon}>
        <IoCloudUploadOutline />
      </div>
      <div className={styles.dropZoneTitle}>{t('import.dropZoneTitle')}</div>
      <div className={styles.dropZoneHint}>{t('import.dropZoneHint')}</div>
      <div className={styles.dropZoneConstraints}>
        {t('import.maxSize')} · {t('import.maxRows')}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className={styles.dropZoneInput}
        onChange={handleChange}
      />
    </div>
  );
}
