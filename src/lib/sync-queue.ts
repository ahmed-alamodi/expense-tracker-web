import { supabase, isConfigured } from './supabase';
import { invalidateCachePattern } from './cache';

function makeId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  entityId?: string;
  createdAt: string;
}

const QUEUE_KEY = '@sync_queue';

function getQueue(): PendingOperation[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(queue: PendingOperation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function addToQueue(op: Omit<PendingOperation, 'id' | 'createdAt'>): Promise<string> {
  const queue = getQueue();
  const id = makeId();
  queue.push({
    ...op,
    id,
    createdAt: new Date().toISOString(),
  });
  setQueue(queue);
  return id;
}

export async function getPendingCount(): Promise<number> {
  const queue = getQueue();
  return queue.length;
}

export async function processSyncQueue(): Promise<void> {
  if (!isConfigured) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining: PendingOperation[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'create') {
        const { _pendingSync, id: _tempId, ...insertData } = op.data;
        const { error } = await supabase.from(op.table).insert(insertData);
        if (error) throw error;
      } else if (op.type === 'update' && op.entityId) {
        const { _pendingSync, ...updateData } = op.data;
        const { error } = await supabase.from(op.table).update(updateData).eq('id', op.entityId);
        if (error) throw error;
      } else if (op.type === 'delete' && op.entityId) {
        const { error } = await supabase.from(op.table).delete().eq('id', op.entityId);
        if (error) throw error;
      }
    } catch {
      remaining.push(op);
    }
  }

  setQueue(remaining);
  await invalidateCachePattern('expenses_');
  await invalidateCachePattern('monthly_total_');
}

export async function generateTempId(): Promise<string> {
  return `temp_${makeId()}`;
}
