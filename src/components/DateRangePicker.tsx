'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IoChevronBack, IoChevronForward, IoCalendarOutline, IoClose } from 'react-icons/io5';

/* ─────────────────────────────────────────
   Helpers
──────────────────────────────────────────*/
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseISO(s: string): [number, number, number] | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return [y, m, d];
}

function formatDisplay(iso: string) {
  const p = parseISO(iso);
  if (!p) return '';
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ─────────────────────────────────────────
   Component
──────────────────────────────────────────*/
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onClear: () => void;
}

export default function DateRangePicker({ startDate, endDate, onApply, onClear }: DateRangePickerProps) {
  const { t } = useTranslation();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  // Internal selection state (before Apply)
  const [selStart, setSelStart] = useState(startDate);
  const [selEnd, setSelEnd] = useState(endDate);
  const [hovered, setHovered] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset internal state when popup opens
  useEffect(() => {
    if (open) {
      setSelStart(startDate);
      setSelEnd(endDate);
      setHovered('');
      if (startDate) {
        const p = parseISO(startDate);
        if (p) { setCalYear(p[0]); setCalMonth(p[1]); }
      } else {
        setCalYear(now.getFullYear());
        setCalMonth(now.getMonth() + 1);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ─── Day click logic ─── */
  const handleDayClick = useCallback((iso: string) => {
    if (!selStart || (selStart && selEnd)) {
      // Start fresh
      setSelStart(iso);
      setSelEnd('');
    } else {
      // Set end
      if (iso < selStart) {
        setSelEnd(selStart);
        setSelStart(iso);
      } else {
        setSelEnd(iso);
      }
    }
  }, [selStart, selEnd]);

  /* ─── Range helpers ─── */
  const effectiveEnd = selEnd || (hovered && selStart && hovered > selStart ? hovered : '');

  function getDayState(iso: string) {
    const isStart = iso === selStart;
    const isEnd = iso === selEnd || (iso === effectiveEnd && !selEnd);
    const inRange = selStart && effectiveEnd && iso > selStart && iso < effectiveEnd;
    return { isStart, isEnd, inRange: !!inRange };
  }

  /* ─── Build calendar cells ─── */
  const totalDays = daysInMonth(calYear, calMonth);
  const startWeekday = firstDayOfWeek(calYear, calMonth);
  const prevMonthDays = daysInMonth(
    calMonth === 1 ? calYear - 1 : calYear,
    calMonth === 1 ? 12 : calMonth - 1
  );

  type Cell = { iso: string; day: number; current: boolean };
  const cells: Cell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = calMonth === 1 ? 12 : calMonth - 1;
    const y = calMonth === 1 ? calYear - 1 : calYear;
    cells.push({ iso: toISO(y, m, d), day: d, current: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ iso: toISO(calYear, calMonth, d), day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = calMonth === 12 ? 1 : calMonth + 1;
    const y = calMonth === 12 ? calYear + 1 : calYear;
    cells.push({ iso: toISO(y, m, d), day: d, current: false });
  }

  /* ─── Navigation ─── */
  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  }

  /* ─── Trigger button label ─── */
  function triggerLabel() {
    if (startDate && endDate) return `${formatDisplay(startDate)}  –  ${formatDisplay(endDate)}`;
    if (startDate) return `${t('home.startDate')}: ${formatDisplay(startDate)}`;
    return t('home.dateRange');
  }

  /* ─── Apply / Clear ─── */
  function handleApply() {
    onApply(selStart, selEnd);
    setOpen(false);
  }
  function handleClear() {
    setSelStart('');
    setSelEnd('');
    onClear();
    setOpen(false);
  }

  const hasSelection = !!(startDate || endDate);

  /* ─────────────── STYLES ─────────────── */
  const popupBg = 'var(--color-card)';
  const popupBorder = 'var(--color-border)';
  const textColor = 'var(--color-text)';
  const textSecondary = 'var(--color-text-secondary)';
  const tintColor = 'var(--color-tint)';
  const bgColor = 'var(--color-bg)';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* ── Trigger button ── */}
      <button
        id="date-range-trigger"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '9px 12px',
          background: popupBg,
          border: `1px solid ${open ? 'var(--color-tint)' : popupBorder}`,
          borderRadius: 10,
          cursor: 'pointer',
          color: hasSelection ? textColor : textSecondary,
          fontSize: 13,
          fontWeight: hasSelection ? 600 : 400,
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          textAlign: 'start',
        }}
      >
        <IoCalendarOutline style={{ fontSize: 16, color: tintColor, flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {triggerLabel()}
        </span>
        {hasSelection && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); handleClear(); }}
            style={{ color: textSecondary, fontSize: 16, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
          >
            <IoClose />
          </span>
        )}
      </button>

      {/* ── Popup ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          insetInlineStart: 0,
          zIndex: 500,
          background: popupBg,
          border: `1px solid ${popupBorder}`,
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
          width: 300,
          padding: '16px 16px 14px',
          animation: 'calendarFadeIn 0.18s ease',
        }}>
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor }}>
              {MONTH_NAMES_EN[calMonth - 1]} {calYear}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                onClick={prevMonth}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSecondary, fontSize: 18, padding: '2px 6px',
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = bgColor)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <IoChevronBack />
              </button>
              <button
                onClick={nextMonth}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSecondary, fontSize: 18, padding: '2px 6px',
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = bgColor)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <IoChevronForward />
              </button>
            </div>
          </div>

          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {DAY_NAMES.map((d, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 600,
                color: textSecondary, padding: '0 0 4px',
              }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
            {cells.map(({ iso, day, current }) => {
              const { isStart, isEnd, inRange } = getDayState(iso);
              const isEndpoint = isStart || isEnd;
              const isToday = iso === toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());

              return (
                <div
                  key={iso}
                  onClick={() => current && handleDayClick(iso)}
                  onMouseEnter={() => selStart && !selEnd && setHovered(iso)}
                  onMouseLeave={() => setHovered('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 34,
                    cursor: current ? 'pointer' : 'default',
                    borderRadius: isEndpoint ? 8 : 0,
                    background: isEndpoint
                      ? textColor
                      : inRange
                        ? 'rgba(128,128,128,0.15)'
                        : 'transparent',
                    /* flatten the radius on connected side for range endpoints */
                    borderStartStartRadius: isStart && !isEnd ? 8 : (isStart && isEnd ? 8 : inRange || isEnd ? 0 : 8),
                    borderEndStartRadius: isStart && !isEnd ? 8 : (isStart && isEnd ? 8 : inRange || isEnd ? 0 : 8),
                    borderStartEndRadius: isEnd && !isStart ? 8 : (isStart && isEnd ? 8 : inRange || isStart ? 0 : 8),
                    borderEndEndRadius: isEnd && !isStart ? 8 : (isStart && isEnd ? 8 : inRange || isStart ? 0 : 8),
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isEndpoint ? 700 : isToday ? 600 : 400,
                    color: isEndpoint ? bgColor : current ? textColor : textSecondary,
                    background: 'transparent',
                    outline: isToday && !isEndpoint ? `1.5px solid ${tintColor}` : 'none',
                  }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: popupBorder, margin: '14px 0 12px' }} />

          {/* Start / End labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
                {t('home.startDate')}
              </div>
              <div style={{
                display: 'flex', gap: 8
              }}>
                <div style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${popupBorder}`,
                  fontSize: 13, fontWeight: 600, color: selStart ? textColor : textSecondary,
                  background: bgColor,
                }}>
                  {selStart ? formatDisplay(selStart) : '—'}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
                {t('home.endDate')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${popupBorder}`,
                  fontSize: 13, fontWeight: 600, color: selEnd ? textColor : textSecondary,
                  background: bgColor,
                }}>
                  {selEnd ? formatDisplay(selEnd) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={handleApply}
            disabled={!selStart}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: textColor,
              color: bgColor,
              fontSize: 14,
              fontWeight: 700,
              cursor: selStart ? 'pointer' : 'not-allowed',
              opacity: selStart ? 1 : 0.5,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {t('home.applyDates')} ↵
          </button>
        </div>
      )}

      <style>{`
        @keyframes calendarFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
