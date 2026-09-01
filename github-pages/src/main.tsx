import React from 'react';
import { createRoot } from 'react-dom/client';

import Dashboard from '@/app/dashboard';
import '@/app/globals.css';
import {
  retiredSeedIds,
  seedOpportunities,
  type SeedOpportunity,
} from '@/lib/opportunities';

type StoredOpportunity = SeedOpportunity & {
  compensation: string;
  stage: string;
  appliedAt: string | null;
  nextActionAt: string | null;
  notes: string;
  favorite: boolean;
  archived: boolean;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY = 'hu-jiayi-2027-job-tracker-v2';
const progressFields = [
  'stage',
  'appliedAt',
  'nextActionAt',
  'notes',
  'favorite',
  'archived',
] as const;

function normalizeSeed(item: SeedOpportunity): StoredOpportunity {
  const now = new Date().toISOString();
  return {
    ...item,
    compensation: item.compensation || '未公开',
    stage: '待投递',
    appliedAt: null,
    nextActionAt: null,
    notes: '',
    favorite: false,
    archived: false,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  };
}

function readStored(): StoredOpportunity[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function currentItems() {
  const stored = readStored();
  const storedById = new Map(stored.map((item) => [item.id, item]));
  const seeds = seedOpportunities
    .filter((item) => !retiredSeedIds.includes(item.id))
    .map((item) => {
      const next = normalizeSeed(item);
      const previous = storedById.get(item.id);
      if (previous) {
        for (const field of progressFields) {
          (next[field] as unknown) = previous[field] as unknown;
        }
        next.createdAt = previous.createdAt || next.createdAt;
        next.updatedAt = previous.updatedAt || next.updatedAt;
      }
      return next;
    });
  const seedIds = new Set(seeds.map((item) => item.id));
  const custom = stored.filter(
    (item) => item.isCustom || !seedIds.has(item.id),
  );
  return [...seeds, ...custom];
}

function persist(items: StoredOpportunity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeCustom(
  raw: Record<string, unknown>,
  previous?: StoredOpportunity,
): StoredOpportunity {
  const company = text(raw.company);
  const role = text(raw.role);
  if (!company || !role) throw new Error('企业和岗位不能为空');
  const now = new Date().toISOString();
  const id = text(raw.id) || `custom-${crypto.randomUUID()}`;
  return {
    id,
    company,
    role,
    tracks: Array.isArray(raw.tracks)
      ? raw.tracks.map(String).slice(0, 4)
      : previous?.tracks || [],
    ownership: text(raw.ownership, previous?.ownership || '私企'),
    scale: text(raw.scale, previous?.scale || '中厂'),
    city: text(raw.city, previous?.city || '待确认'),
    applyUrl: text(raw.applyUrl, previous?.applyUrl || ''),
    sourceUrl: text(raw.sourceUrl, previous?.sourceUrl || ''),
    sourceLabel: previous?.sourceLabel || '手动添加',
    startDate: text(raw.startDate) || previous?.startDate || null,
    endDate: text(raw.endDate) || previous?.endDate || null,
    deadlineNote: text(
      raw.deadlineNote,
      previous?.deadlineNote || '手动添加，待核实',
    ),
    recommendation: Math.min(
      5,
      Math.max(1, Number(raw.recommendation ?? previous?.recommendation) || 3),
    ),
    fitReason: text(raw.fitReason, previous?.fitReason || ''),
    riskNote: text(raw.riskNote, previous?.riskNote || ''),
    degreeGate: text(raw.degreeGate, previous?.degreeGate || '待核实'),
    compensation: text(
      raw.compensation,
      previous?.compensation || '未公开',
    ),
    verifiedAt: text(
      raw.verifiedAt,
      previous?.verifiedAt || now.slice(0, 10),
    ),
    stage: text(raw.stage, previous?.stage || '待投递'),
    appliedAt: text(raw.appliedAt) || previous?.appliedAt || null,
    nextActionAt:
      text(raw.nextActionAt) || previous?.nextActionAt || null,
    notes: text(raw.notes, previous?.notes || ''),
    favorite:
      typeof raw.favorite === 'boolean'
        ? raw.favorite
        : previous?.favorite || false,
    archived:
      typeof raw.archived === 'boolean'
        ? raw.archived
        : previous?.archived || false,
    isCustom: true,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
}

const networkFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const requestUrl =
    input instanceof Request ? input.url : input instanceof URL ? input.href : input;
  const url = new URL(requestUrl, window.location.href);
  if (!url.pathname.includes('/api/opportunities')) {
    return networkFetch(input, init);
  }

  const method = (init?.method || (input instanceof Request ? input.method : 'GET'))
    .toUpperCase();
  let items = currentItems();

  if (method === 'GET' && /\/api\/opportunities\/?$/.test(url.pathname)) {
    persist(items);
    return json({ opportunities: items });
  }

  if (method === 'PATCH') {
    const id = decodeURIComponent(url.pathname.split('/').pop() || '');
    const changes = JSON.parse(String(init?.body || '{}')) as Record<
      string,
      unknown
    >;
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return json({ error: '记录不存在' }, 404);
    items[index] = {
      ...items[index],
      ...changes,
      id,
      recommendation: Math.min(
        5,
        Math.max(
          1,
          Number(changes.recommendation ?? items[index].recommendation) || 3,
        ),
      ),
      updatedAt: new Date().toISOString(),
    } as StoredOpportunity;
    persist(items);
    return json({ ok: true });
  }

  if (method === 'POST') {
    try {
      const body = JSON.parse(String(init?.body || '{}')) as Record<
        string,
        unknown
      >;
      const incoming = Array.isArray(body.items) ? body.items : [body];
      if (incoming.length > 200)
        return json({ error: '一次最多导入200条' }, 400);
      for (const rawValue of incoming) {
        const raw = rawValue as Record<string, unknown>;
        const sourceId = text(raw.id);
        const index = sourceId
          ? items.findIndex((item) => item.id === sourceId)
          : -1;
        const normalized = normalizeCustom(
          raw,
          index >= 0 ? items[index] : undefined,
        );
        if (index >= 0) items[index] = normalized;
        else items.push(normalized);
      }
      persist(items);
      return json({ ok: true, count: incoming.length });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : '保存失败' },
        400,
      );
    }
  }

  return json({ error: '不支持的操作' }, 405);
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
);
