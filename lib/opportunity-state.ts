import type { SeedOpportunity } from './opportunities';

export type StoredOpportunity = SeedOpportunity & {
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

const progressFields = [
  'stage', 'appliedAt', 'nextActionAt', 'notes', 'favorite', 'archived',
] as const;

export function mergeOpportunities(
  seeds: SeedOpportunity[],
  stored: StoredOpportunity[],
  now = new Date().toISOString(),
): StoredOpportunity[] {
  const previousById = new Map(stored.map((item) => [item.id, item]));
  const current = seeds.map((item): StoredOpportunity => {
    const next: StoredOpportunity = {
      ...item, compensation: item.compensation || '未公开',
      stage: item.initialStage || '待投递', appliedAt: item.initialAppliedAt || null,
      nextActionAt: null, notes: '',
      favorite: false, archived: false, isCustom: false,
      createdAt: now, updatedAt: now,
    };
    const previous = previousById.get(item.id);
    if (previous) {
      for (const field of progressFields) {
        if (previous[field] !== undefined) {
          (next[field] as unknown) = previous[field];
        }
      }
      next.createdAt = previous.createdAt || now;
      next.updatedAt = previous.updatedAt || now;
    }
    return next;
  });
  const seedIds = new Set(seeds.map((item) => item.id));
  // 已导入的种子按ID去重。移出推荐的历史记录仍保存，不能变成自定义记录重新出现。
  const historyAndCustom = [...previousById.values()].filter((item) => !seedIds.has(item.id));
  return [...current, ...historyAndCustom];
}
