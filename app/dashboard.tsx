'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileUp,
  FilterX,
  LoaderCircle,
  Plus,
  Search,
  Star,
  StarOff,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Opportunity = {
  id: string;
  company: string;
  role: string;
  tracks: string[];
  ownership: string;
  scale: string;
  city: string;
  applyUrl: string;
  sourceUrl: string;
  sourceLabel: string;
  startDate: string | null;
  endDate: string | null;
  deadlineNote: string;
  recommendation: number;
  fitReason: string;
  riskNote: string;
  degreeGate: string;
  compensation: string;
  verifiedAt: string;
  stage: string;
  appliedAt: string | null;
  nextActionAt: string | null;
  notes: string;
  favorite: boolean;
  archived: boolean;
  isCustom: boolean;
  updatedAt?: string;
};

const TRACKS = [
  '全部方向',
  'AI应用产品',
  'B端软件/平台',
  '智能硬件/IoT',
  '能源数字化/央国企',
];
const STAGES = [
  '待投递',
  '准备中',
  '已投递',
  '笔试',
  '面试',
  'Offer',
  '已拒绝',
  '放弃',
];
const OWNERSHIPS = ['全部性质', '央企', '国企', '私企', '外企', '混合所有制'];
const SCALES = ['全部规模', '中厂', '成长公司', '大厂'];

const EMPTY: Opportunity = {
  id: '',
  company: '',
  role: '',
  tracks: ['B端软件/平台'],
  ownership: '私企',
  scale: '中厂',
  city: '',
  applyUrl: '',
  sourceUrl: '',
  sourceLabel: '手动添加',
  startDate: null,
  endDate: null,
  deadlineNote: '待核实',
  recommendation: 3,
  fitReason: '',
  riskNote: '',
  degreeGate: '待核实',
  compensation: '未公开',
  verifiedAt: new Date().toISOString().slice(0, 10),
  stage: '待投递',
  appliedAt: null,
  nextActionAt: null,
  notes: '',
  favorite: false,
  archived: false,
  isCustom: true,
};

function localDate(date: string | null) {
  if (!date) return '未公布';
  return date.slice(5).replace('-', '.');
}

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function deadlineTone(item: Opportunity) {
  const days = daysUntil(item.endDate);
  if (days === null) return 'text-muted-foreground';
  if (days < 0) return 'text-destructive';
  if (days <= 7) return 'text-orange-700';
  if (days <= 30) return 'text-amber-700';
  return 'text-muted-foreground';
}

function recommendationLabel(score: number) {
  if (score >= 5) return '强推';
  if (score === 4) return '优先';
  if (score === 3) return '可投';
  return '低优先';
}

function csvCell(value: unknown) {
  const content = Array.isArray(value)
    ? value.join(' / ')
    : typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  return `"${content.replaceAll('"', '""')}"`;
}

function formString(data: FormData, name: string, fallback = '') {
  const value = data.get(name);
  return typeof value === 'string' ? value : fallback;
}

function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState('全部方向');
  const [ownership, setOwnership] = useState('全部性质');
  const [scale, setScale] = useState('全部规模');
  const [stage, setStage] = useState('全部阶段');
  const [sort, setSort] = useState('recommended');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/opportunities', { cache: 'no-store' });
      if (!response.ok) throw new Error('企业库加载失败');
      const data = (await response.json()) as { opportunities: Opportunity[] };
      setItems(data.opportunities);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [
    query,
    track,
    ownership,
    scale,
    stage,
    sort,
    favoriteOnly,
    upcomingOnly,
    showArchived,
    pageSize,
  ]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const patchItem = useCallback(
    async (id: string, changes: Partial<Opportunity>) => {
      const previous = items.find((item) => item.id === id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
      setSavingIds((current) => new Set(current).add(id));
      try {
        const response = await fetch(
          `/api/opportunities/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
          },
        );
        if (!response.ok)
          throw new Error(
            ((await response.json()) as { error?: string }).error || '保存失败',
          );
        setNotice('已自动保存');
      } catch (error) {
        if (previous)
          setItems((current) =>
            current.map((item) => (item.id === id ? previous : item)),
          );
        setNotice(error instanceof Error ? error.message : '保存失败');
      } finally {
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [items],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = items.filter((item) => {
      if (item.stage === '放弃') return false;
      if (item.archived !== showArchived) return false;
      if (
        normalized &&
        ![
          item.company,
          item.role,
          item.city,
          item.notes,
          item.fitReason,
          ...item.tracks,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      )
        return false;
      if (track !== '全部方向' && !item.tracks.includes(track)) return false;
      if (ownership !== '全部性质' && item.ownership !== ownership)
        return false;
      if (scale !== '全部规模' && item.scale !== scale) return false;
      if (stage !== '全部阶段' && item.stage !== stage) return false;
      if (favoriteOnly && !item.favorite) return false;
      if (upcomingOnly) {
        const days = daysUntil(item.endDate);
        if (days === null || days < 0 || days > 30) return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'deadline')
        return (a.endDate || '9999-12-31').localeCompare(
          b.endDate || '9999-12-31',
        );
      if (sort === 'company')
        return a.company.localeCompare(b.company, 'zh-CN');
      if (sort === 'updated')
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      if (sort === 'midfirst')
        return (
          Number(b.scale === '中厂') - Number(a.scale === '中厂') ||
          b.recommendation - a.recommendation
        );
      return (
        b.recommendation - a.recommendation ||
        Number(b.favorite) - Number(a.favorite)
      );
    });
  }, [
    items,
    query,
    track,
    ownership,
    scale,
    stage,
    sort,
    favoriteOnly,
    upcomingOnly,
    showArchived,
  ]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const metrics = useMemo(() => {
    const active = items.filter(
      (item) => !item.archived && item.stage !== '放弃',
    );
    return {
      total: active.length,
      mid: active.filter(
        (item) => item.scale === '中厂' || item.scale === '成长公司',
      ).length,
      urgent: active.filter((item) => {
        const days = daysUntil(item.endDate);
        return days !== null && days >= 0 && days <= 14;
      }).length,
      applied: active.filter(
        (item) => !['待投递', '准备中', '放弃'].includes(item.stage),
      ).length,
    };
  }, [items]);

  function resetFilters() {
    setQuery('');
    setTrack('全部方向');
    setOwnership('全部性质');
    setScale('全部规模');
    setStage('全部阶段');
    setFavoriteOnly(false);
    setUpcomingOnly(false);
    setShowArchived(false);
    setSort('recommended');
  }

  function focusDeadlines() {
    setUpcomingOnly(true);
    setSort('deadline');
    setShowArchived(false);
    document
      .getElementById('opportunity-table')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveEditor(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    const payload: Partial<Opportunity> = {
      company: formString(data, 'company').trim(),
      role: formString(data, 'role').trim(),
      tracks: formString(data, 'tracks')
        .split(/[、,，/]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 4),
      ownership: formString(data, 'ownership', '私企'),
      scale: formString(data, 'scale', '中厂'),
      city: formString(data, 'city').trim(),
      applyUrl: formString(data, 'applyUrl').trim(),
      sourceUrl: formString(data, 'sourceUrl').trim(),
      startDate: formString(data, 'startDate') || null,
      endDate: formString(data, 'endDate') || null,
      deadlineNote: formString(data, 'deadlineNote').trim(),
      recommendation: Number(formString(data, 'recommendation', '3')),
      fitReason: formString(data, 'fitReason').trim(),
      riskNote: formString(data, 'riskNote').trim(),
      degreeGate: formString(data, 'degreeGate').trim(),
      compensation: formString(data, 'compensation').trim(),
      stage: formString(data, 'stage', '待投递'),
      appliedAt: formString(data, 'appliedAt') || null,
      nextActionAt: formString(data, 'nextActionAt') || null,
      notes: formString(data, 'notes').trim(),
      archived: data.get('archived') === 'on',
    };
    if (!payload.company || !payload.role) {
      setNotice('企业和岗位不能为空');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing.id
        ? `/api/opportunities/${encodeURIComponent(editing.id)}`
        : '/api/opportunities';
      const response = await fetch(url, {
        method: editing.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok)
        throw new Error(
          ((await response.json()) as { error?: string }).error || '保存失败',
        );
      setEditing(null);
      setNotice(editing.id ? '修改已保存' : '机会已添加');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const itemsToImport = Array.isArray(parsed)
        ? parsed
        : parsed.opportunities;
      if (!Array.isArray(itemsToImport))
        throw new Error('请选择本看板导出的 JSON 文件');
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToImport }),
      });
      if (!response.ok)
        throw new Error(
          ((await response.json()) as { error?: string }).error || '导入失败',
        );
      setNotice(`成功导入 ${itemsToImport.length} 条`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '导入失败');
    }
  }

  function exportJson() {
    downloadBlob(
      JSON.stringify(
        { exportedAt: new Date().toISOString(), opportunities: items },
        null,
        2,
      ),
      '胡佳仪-2027秋招投递表.json',
      'application/json',
    );
    setNotice('JSON 已导出');
  }

  function exportCsv() {
    const headers = [
      '企业',
      '岗位',
      '方向',
      '性质',
      '规模',
      '城市',
      '推荐度',
      '阶段',
      '开始时间',
      '截止时间',
      '网申链接',
      '待遇',
      '下一步日期',
      '备注',
    ];
    const rows = items.map((item) => [
      item.company,
      item.role,
      item.tracks,
      item.ownership,
      item.scale,
      item.city,
      item.recommendation,
      item.stage,
      item.startDate,
      item.endDate,
      item.applyUrl,
      item.compensation,
      item.nextActionAt,
      item.notes,
    ]);
    downloadBlob(
      '\ufeff' +
        [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n'),
      '胡佳仪-2027秋招投递表.csv',
      'text/csv;charset=utf-8',
    );
    setNotice('CSV 已导出');
  }

  return (
    <main className="min-h-screen bg-background px-3 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <header className="flex flex-col gap-5 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Hu Jiayi · 2027 Campus Recruiting
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              秋招投递台
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              把对口机会、投递进度和截止时间放在一张能真正行动的表里。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={upcomingOnly ? 'secondary' : 'outline'}
              onClick={focusDeadlines}
            >
              <CalendarClock /> 30天内截止
            </Button>
            <Button
              variant="outline"
              onClick={() => importRef.current?.click()}
            >
              <FileUp /> 导入
            </Button>
            <input
              ref={importRef}
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importJson(file);
                event.target.value = '';
              }}
            />
            <Button onClick={() => setEditing({ ...EMPTY })}>
              <Plus /> 新增机会
            </Button>
          </div>
        </header>

        <section className="grid gap-3 py-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['已核实机会', metrics.total, '自动加入新核实企业'],
            ['中厂 / 成长公司', metrics.mid, '本轮重点补充'],
            ['14天内截止', metrics.urgent, '按明确截止日统计'],
            ['已推进投递', metrics.applied, '投递及后续阶段'],
          ].map(([label, value, note]) => (
            <article key={label} className="metric-card">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <strong className="text-3xl font-semibold tracking-[-0.05em]">
                  {loading ? '—' : value}
                </strong>
                <span className="pb-1 text-xs text-muted-foreground">
                  {note}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section
          id="opportunity-table"
          className="scroll-mt-3 overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_16px_50px_rgba(31,42,35,0.06)]"
        >
          <div className="border-b border-border bg-card p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 pl-9"
                  placeholder="搜索企业、岗位、城市、备注…"
                  aria-label="搜索企业或岗位"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={favoriteOnly ? 'secondary' : 'ghost'}
                  onClick={() => setFavoriteOnly((value) => !value)}
                >
                  <Star /> 收藏
                </Button>
                <Button
                  size="sm"
                  variant={showArchived ? 'secondary' : 'ghost'}
                  onClick={() => setShowArchived((value) => !value)}
                >
                  归档
                </Button>
                <Button size="sm" variant="ghost" onClick={resetFilters}>
                  <FilterX /> 清空筛选
                </Button>
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportJson}>
                  <Download /> JSON
                </Button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {TRACKS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={track === item ? 'secondary' : 'ghost'}
                  onClick={() => setTrack(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <NativeSelect
                className="w-full"
                aria-label="企业性质"
                value={ownership}
                onChange={(event) => setOwnership(event.target.value)}
              >
                {OWNERSHIPS.map((item) => (
                  <NativeSelectOption key={item}>{item}</NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                className="w-full"
                aria-label="企业规模"
                value={scale}
                onChange={(event) => setScale(event.target.value)}
              >
                {SCALES.map((item) => (
                  <NativeSelectOption key={item}>{item}</NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                className="w-full"
                aria-label="投递阶段"
                value={stage}
                onChange={(event) => setStage(event.target.value)}
              >
                <NativeSelectOption>全部阶段</NativeSelectOption>
                {STAGES.filter((item) => item !== '放弃').map((item) => (
                  <NativeSelectOption key={item}>{item}</NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                className="w-full"
                aria-label="排序"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <NativeSelectOption value="recommended">
                  推荐度优先
                </NativeSelectOption>
                <NativeSelectOption value="midfirst">
                  中厂优先
                </NativeSelectOption>
                <NativeSelectOption value="deadline">
                  截止日优先
                </NativeSelectOption>
                <NativeSelectOption value="company">
                  企业名称
                </NativeSelectOption>
                <NativeSelectOption value="updated">
                  最近编辑
                </NativeSelectOption>
              </NativeSelect>
              <Button
                variant={upcomingOnly ? 'secondary' : 'outline'}
                onClick={() => setUpcomingOnly((value) => !value)}
              >
                <CalendarClock /> {upcomingOnly ? '30天内截止' : '不限截止日'}
              </Button>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[1340px]">
              <TableHeader className="bg-muted/55">
                <TableRow>
                  <TableHead className="w-[44px]">完成</TableHead>
                  <TableHead>企业与岗位</TableHead>
                  <TableHead>匹配方向</TableHead>
                  <TableHead>性质 / 规模</TableHead>
                  <TableHead>网申时间</TableHead>
                  <TableHead>待遇</TableHead>
                  <TableHead>推荐</TableHead>
                  <TableHead>我的阶段</TableHead>
                  <TableHead>下一步</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingRows />
                ) : visible.length === 0 ? (
                  <EmptyRow />
                ) : (
                  visible.map((item) => (
                    <OpportunityRows
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      saving={savingIds.has(item.id)}
                      onExpand={() =>
                        setExpandedId((id) => (id === item.id ? null : item.id))
                      }
                      onPatch={(changes) => void patchItem(item.id, changes)}
                      onEdit={() => setEditing(item)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                加载企业库…
              </div>
            ) : visible.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                没有符合当前筛选的机会
              </div>
            ) : (
              visible.map((item) => (
                <MobileCard
                  key={item.id}
                  item={item}
                  saving={savingIds.has(item.id)}
                  onPatch={(changes) => void patchItem(item.id, changes)}
                  onEdit={() => setEditing(item)}
                />
              ))
            )}
          </div>

          <Pagination
            filteredCount={filtered.length}
            page={safePage}
            pages={pages}
            pageSize={pageSize}
            onPageSize={setPageSize}
            onPage={setPage}
          />
        </section>
      </div>

      <OpportunityDialog
        editing={editing}
        submitting={submitting}
        onClose={() => setEditing(null)}
        onSubmit={saveEditor}
      />
      {notice ? (
        <div className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-xl">
          <Check className="size-4" />
          {notice}
        </div>
      ) : null}
    </main>
  );
}

function Pagination({
  filteredCount,
  page,
  pages,
  pageSize,
  onPageSize,
  onPage,
}: {
  filteredCount: number;
  page: number;
  pages: number;
  pageSize: number;
  onPageSize: (size: number) => void;
  onPage: (page: number) => void;
}) {
  const numbers = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) =>
      pages <= 7 ||
      Math.abs(value - page) <= 1 ||
      value === 1 ||
      value === pages,
  );
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-1.5">
        <BriefcaseBusiness className="size-3.5" /> 筛选后 {filteredCount} 条 ·
        第 {page}/{pages} 页
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <span>每页</span>
        <NativeSelect
          size="sm"
          value={String(pageSize)}
          onChange={(event) => onPageSize(Number(event.target.value))}
        >
          <NativeSelectOption value="8">8</NativeSelectOption>
          <NativeSelectOption value="12">12</NativeSelectOption>
          <NativeSelectOption value="24">24</NativeSelectOption>
        </NativeSelect>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
          aria-label="上一页"
        >
          <ChevronLeft />
        </Button>
        {numbers.map((value, index) => (
          <span key={value} className="contents">
            {index > 0 && value - numbers[index - 1] > 1 ? (
              <span>…</span>
            ) : null}
            <Button
              size="icon-sm"
              variant={page === value ? 'secondary' : 'ghost'}
              onClick={() => onPage(value)}
            >
              {value}
            </Button>
          </span>
        ))}
        <Button
          size="icon-sm"
          variant="outline"
          disabled={page >= pages}
          onClick={() => onPage(Math.min(pages, page + 1))}
          aria-label="下一页"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function OpportunityRows({
  item,
  expanded,
  saving,
  onExpand,
  onPatch,
  onEdit,
}: {
  item: Opportunity;
  expanded: boolean;
  saving: boolean;
  onExpand: () => void;
  onPatch: (changes: Partial<Opportunity>) => void;
  onEdit: () => void;
}) {
  const checked = !['待投递', '准备中', '放弃'].includes(item.stage);
  return (
    <>
      <TableRow className="h-[78px]">
        <TableCell>
          <Checkbox
            checked={checked}
            onCheckedChange={(value) =>
              onPatch({
                stage: value ? '已投递' : '待投递',
                appliedAt: value ? new Date().toISOString().slice(0, 10) : null,
              })
            }
            aria-label={`${item.company}已投递`}
          />
        </TableCell>
        <TableCell className="max-w-[330px]">
          <button
            type="button"
            onClick={onExpand}
            className="group w-full text-left"
          >
            <span className="inline-flex items-center gap-1 font-semibold tracking-tight group-hover:text-primary">
              {item.favorite ? (
                <Star className="size-3.5 fill-current text-amber-500" />
              ) : null}
              {item.company}
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform',
                  expanded && 'rotate-180',
                )}
              />
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {item.role}
            </span>
          </button>
        </TableCell>
        <TableCell className="max-w-[210px]">
          <div className="flex flex-wrap gap-1">
            {item.tracks.slice(0, 2).map((value) => (
              <Badge key={value} variant="outline" className="text-[11px]">
                {value}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{item.ownership}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {item.scale} · {item.city}
          </div>
        </TableCell>
        <TableCell className={cn('font-mono text-xs', deadlineTone(item))}>
          <div>
            {localDate(item.startDate)} — {localDate(item.endDate)}
          </div>
          <div className="mt-1 max-w-[190px] truncate font-sans">
            {item.deadlineNote}
          </div>
        </TableCell>
        <TableCell className="max-w-[180px] text-xs text-muted-foreground">
          <span className="line-clamp-2">{item.compensation || '未公开'}</span>
        </TableCell>
        <TableCell>
          <span
            className={cn(
              'rating',
              item.recommendation >= 5
                ? 'rating-emerald'
                : item.recommendation === 4
                  ? 'rating-violet'
                  : 'rating-amber',
            )}
          >
            {recommendationLabel(item.recommendation)} · {item.recommendation}
          </span>
        </TableCell>
        <TableCell>
          <NativeSelect
            size="sm"
            value={item.stage}
            onChange={(event) =>
              onPatch({
                stage: event.target.value,
                appliedAt:
                  event.target.value === '已投递' && !item.appliedAt
                    ? new Date().toISOString().slice(0, 10)
                    : item.appliedAt,
              })
            }
          >
            {STAGES.map((value) => (
              <NativeSelectOption key={value}>{value}</NativeSelectOption>
            ))}
          </NativeSelect>
          {saving ? (
            <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <LoaderCircle className="size-2.5 animate-spin" />
              保存中
            </span>
          ) : null}
        </TableCell>
        <TableCell>
          <Input
            type="date"
            className="h-7 w-[134px] text-xs"
            value={item.nextActionAt || ''}
            onChange={(event) =>
              onPatch({ nextActionAt: event.target.value || null })
            }
            aria-label={`${item.company}下一步日期`}
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onPatch({ favorite: !item.favorite })}
              aria-label={item.favorite ? '取消收藏' : '收藏'}
            >
              {item.favorite ? <StarOff /> : <Star />}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onEdit}
              aria-label="编辑"
            >
              <Edit3 />
            </Button>
            {item.applyUrl ? (
              <a
                className={buttonVariants({
                  variant: 'ghost',
                  size: 'icon-sm',
                })}
                href={item.applyUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`打开${item.company}网申`}
              >
                <ArrowUpRight />
              </a>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="bg-muted/22">
          <TableCell colSpan={10} className="whitespace-normal">
            <div className="grid min-w-0 gap-5 px-2 py-3 text-xs leading-5 lg:grid-cols-2 xl:grid-cols-4">
              <Detail label="为什么推荐" value={item.fitReason} />
              <Detail label="风险 / 准备重点" value={item.riskNote} />
              <Detail label="学历门槛" value={item.degreeGate} />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">核实与备注</p>
                <p className="mt-1 text-muted-foreground">
                  {item.verifiedAt} · {item.sourceLabel}
                </p>
                {item.notes ? (
                  <p className="mt-2 whitespace-pre-wrap">{item.notes}</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">暂无个人备注</p>
                )}
                {item.sourceUrl ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看信息源
                    <ArrowUpRight className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function MobileCard({
  item,
  saving,
  onPatch,
  onEdit,
}: {
  item: Opportunity;
  saving: boolean;
  onPatch: (changes: Partial<Opportunity>) => void;
  onEdit: () => void;
}) {
  const checked = !['待投递', '准备中', '放弃'].includes(item.stage);
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={checked}
              onCheckedChange={(value) =>
                onPatch({
                  stage: value ? '已投递' : '待投递',
                  appliedAt: value
                    ? new Date().toISOString().slice(0, 10)
                    : null,
                })
              }
            />
            <h2 className="truncate font-semibold">{item.company}</h2>
            {item.favorite ? (
              <Star className="size-3.5 fill-current text-amber-500" />
            ) : null}
          </div>
          <p className="ml-6 mt-1 text-xs text-muted-foreground">{item.role}</p>
        </div>
        <span
          className={cn(
            'rating',
            item.recommendation >= 5
              ? 'rating-emerald'
              : item.recommendation === 4
                ? 'rating-violet'
                : 'rating-amber',
          )}
        >
          {recommendationLabel(item.recommendation)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {item.tracks.map((value) => (
          <Badge key={value} variant="outline" className="text-[11px]">
            {value}
          </Badge>
        ))}
        <Badge variant="secondary" className="text-[11px]">
          {item.ownership} · {item.scale}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">网申时间</p>
          <p className={cn('mt-1 font-mono', deadlineTone(item))}>
            {localDate(item.startDate)} — {localDate(item.endDate)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">城市</p>
          <p className="mt-1">{item.city}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">待遇</p>
          <p className="mt-1">{item.compensation || '未公开'}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {item.fitReason}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <NativeSelect
          className="flex-1"
          size="sm"
          value={item.stage}
          onChange={(event) => onPatch({ stage: event.target.value })}
        >
          {STAGES.map((value) => (
            <NativeSelectOption key={value}>{value}</NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onPatch({ favorite: !item.favorite })}
          aria-label={
            item.favorite ? `取消收藏${item.company}` : `收藏${item.company}`
          }
        >
          <Star />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onEdit}
          aria-label={`编辑${item.company}`}
        >
          <Edit3 />
        </Button>
        {item.applyUrl ? (
          <a
            className={buttonVariants({ variant: 'default', size: 'sm' })}
            href={item.applyUrl}
            target="_blank"
            rel="noreferrer"
          >
            网申
            <ArrowUpRight />
          </a>
        ) : null}
      </div>
      {saving ? (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <LoaderCircle className="size-2.5 animate-spin" />
          保存中
        </p>
      ) : null}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1 whitespace-normal break-words text-muted-foreground">
        {value || '待补充'}
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index} className="h-[78px]">
          <TableCell colSpan={10}>
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell
        colSpan={10}
        className="h-40 text-center text-sm text-muted-foreground"
      >
        没有符合当前筛选的机会，试试清空筛选或切换“归档”。
      </TableCell>
    </TableRow>
  );
}

function FormField({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={cn(
        'grid gap-1.5 text-xs font-medium',
        wide && 'sm:col-span-2',
      )}
    >
      {label}
      {children}
    </label>
  );
}

function OpportunityDialog({
  editing,
  submitting,
  onClose,
  onSubmit,
}: {
  editing: Opportunity | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog
      open={Boolean(editing)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {editing ? (
        <DialogContent
          key={editing.id || 'new'}
          className="max-h-[92vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle>
              {editing.id ? `编辑 · ${editing.company}` : '新增投递机会'}
            </DialogTitle>
            <DialogDescription>
              保存后会写入你的私人投递表；后续新增企业不会覆盖你的阶段和备注。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="企业 *">
                <Input name="company" defaultValue={editing.company} required />
              </FormField>
              <FormField label="岗位 *">
                <Input name="role" defaultValue={editing.role} required />
              </FormField>
              <FormField label="匹配方向（用顿号分隔）" wide>
                <Input name="tracks" defaultValue={editing.tracks.join('、')} />
              </FormField>
              <FormField label="企业性质">
                <NativeSelect
                  className="w-full"
                  name="ownership"
                  defaultValue={editing.ownership}
                >
                  {OWNERSHIPS.slice(1).map((value) => (
                    <NativeSelectOption key={value}>{value}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="企业规模">
                <NativeSelect
                  className="w-full"
                  name="scale"
                  defaultValue={editing.scale}
                >
                  {SCALES.slice(1).map((value) => (
                    <NativeSelectOption key={value}>{value}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="城市">
                <Input name="city" defaultValue={editing.city} />
              </FormField>
              <FormField label="推荐度">
                <NativeSelect
                  className="w-full"
                  name="recommendation"
                  defaultValue={String(editing.recommendation)}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <NativeSelectOption key={value} value={String(value)}>
                      {value} · {recommendationLabel(value)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="网申链接" wide>
                <Input
                  name="applyUrl"
                  type="url"
                  defaultValue={editing.applyUrl}
                />
              </FormField>
              <FormField label="信息源链接" wide>
                <Input
                  name="sourceUrl"
                  type="url"
                  defaultValue={editing.sourceUrl}
                />
              </FormField>
              <FormField label="网申开始">
                <Input
                  name="startDate"
                  type="date"
                  defaultValue={editing.startDate || ''}
                />
              </FormField>
              <FormField label="网申截止">
                <Input
                  name="endDate"
                  type="date"
                  defaultValue={editing.endDate || ''}
                />
              </FormField>
              <FormField label="时间说明" wide>
                <Input
                  name="deadlineNote"
                  defaultValue={editing.deadlineNote}
                />
              </FormField>
              <FormField label="我的阶段">
                <NativeSelect
                  className="w-full"
                  name="stage"
                  defaultValue={editing.stage}
                >
                  {STAGES.map((value) => (
                    <NativeSelectOption key={value}>{value}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="投递日期">
                <Input
                  name="appliedAt"
                  type="date"
                  defaultValue={editing.appliedAt || ''}
                />
              </FormField>
              <FormField label="下一步日期">
                <Input
                  name="nextActionAt"
                  type="date"
                  defaultValue={editing.nextActionAt || ''}
                />
              </FormField>
              <FormField label="学历门槛">
                <Input name="degreeGate" defaultValue={editing.degreeGate} />
              </FormField>
              <FormField label="待遇">
                <Input
                  name="compensation"
                  defaultValue={editing.compensation}
                  placeholder="如：15–20K/月，五险一金"
                />
              </FormField>
              <FormField label="推荐理由" wide>
                <Textarea name="fitReason" defaultValue={editing.fitReason} />
              </FormField>
              <FormField label="风险 / 准备重点" wide>
                <Textarea name="riskNote" defaultValue={editing.riskNote} />
              </FormField>
              <FormField label="我的备注" wide>
                <Textarea
                  name="notes"
                  defaultValue={editing.notes}
                  placeholder="内推人、面试准备、岗位编号、沟通记录……"
                />
              </FormField>
              {editing.id ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="archived"
                    defaultChecked={editing.archived}
                  />
                  归档这条机会
                </label>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Check />
                )}
                {editing.id ? '保存修改' : '添加机会'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
