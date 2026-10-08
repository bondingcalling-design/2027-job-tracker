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

export function normalizeCompanyName(company: string) {
  return company
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/(?:集团股份有限公司|股份有限公司|有限责任公司|有限公司|控股集团|科技集团|集团)$/g, '')
    .replace(/[^a-z0-9\u3400-\u9fff]/g, '');
}

function hasUserDecision(item: StoredOpportunity | undefined) {
  if (!item) return false;
  return item.isCustom
    || item.stage !== '待投递'
    || Boolean(item.appliedAt || item.nextActionAt || item.notes || item.favorite || item.archived);
}

export function mergeOpportunities(
  seeds: SeedOpportunity[],
  stored: StoredOpportunity[],
  now = new Date().toISOString(),
): StoredOpportunity[] {
  const previousById = new Map(stored.map((item) => [item.id, item]));
  const storedByCompany = new Map<string, StoredOpportunity[]>();
  for (const item of previousById.values()) {
    const key = normalizeCompanyName(item.company);
    if (!key) continue;
    storedByCompany.set(key, [...(storedByCompany.get(key) || []), item]);
  }

  const skippedSeedIds = new Set<string>();
  const dedupedSeeds = seeds.filter((item) => {
    const previous = previousById.get(item.id);
    if (hasUserDecision(previous)) return true;
    const sameCompany = storedByCompany.get(normalizeCompanyName(item.company)) || [];
    const duplicate = sameCompany.some((storedItem) => storedItem.id !== item.id);
    if (duplicate) skippedSeedIds.add(item.id);
    return !duplicate;
  });

  const current = dedupedSeeds.map((item): StoredOpportunity => {
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
  // 同公司已有用户决策时，新种子不会再生成第二张卡；被跳过的新种子历史也一并丢弃。
  const historyAndCustom = [...previousById.values()].filter((item) =>
    !seedIds.has(item.id) && !skippedSeedIds.has(item.id),
  );
  return [...current, ...historyAndCustom];
}
