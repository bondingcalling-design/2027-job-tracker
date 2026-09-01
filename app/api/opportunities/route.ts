import { getD1, ensureSchema } from '@/db';
import {
  retiredSeedIds,
  seedOpportunities,
  type SeedOpportunity,
} from '@/lib/opportunities';

export const dynamic = 'force-dynamic';

function ownerFrom(request: Request) {
  return (
    request.headers.get('oai-authenticated-user-id') ||
    request.headers.get('oai-authenticated-user-email') ||
    'local-dev'
  );
}

function rowKey(ownerId: string, sourceId: string) {
  return `${ownerId}:${sourceId}`;
}

function seedStatement(ownerId: string, item: SeedOpportunity) {
  const now = new Date().toISOString();
  return getD1()
    .prepare(`INSERT INTO opportunities (
      row_key, source_id, owner_id, company, role, tracks, ownership, scale, city,
      apply_url, source_url, source_label, start_date, end_date, deadline_note,
      recommendation, fit_reason, risk_note, degree_gate, compensation, verified_at, stage,
      notes, favorite, archived, is_custom, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待投递', '', 0, 0, 0, ?, ?)
    ON CONFLICT(owner_id, source_id) DO UPDATE SET
      company=excluded.company, role=excluded.role, tracks=excluded.tracks,
      ownership=excluded.ownership, scale=excluded.scale, city=excluded.city,
      apply_url=excluded.apply_url, source_url=excluded.source_url,
      source_label=excluded.source_label, start_date=excluded.start_date,
      end_date=excluded.end_date, deadline_note=excluded.deadline_note,
      recommendation=excluded.recommendation, fit_reason=excluded.fit_reason,
      risk_note=excluded.risk_note, degree_gate=excluded.degree_gate,
      compensation=excluded.compensation, verified_at=excluded.verified_at`)
    .bind(
      rowKey(ownerId, item.id),
      item.id,
      ownerId,
      item.company,
      item.role,
      JSON.stringify(item.tracks),
      item.ownership,
      item.scale,
      item.city,
      item.applyUrl,
      item.sourceUrl,
      item.sourceLabel,
      item.startDate,
      item.endDate,
      item.deadlineNote,
      item.recommendation,
      item.fitReason,
      item.riskNote,
      item.degreeGate,
      item.compensation || '未公开',
      item.verifiedAt,
      now,
      now,
    );
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.source_id,
    company: row.company,
    role: row.role,
    tracks: JSON.parse(typeof row.tracks === 'string' ? row.tracks : '[]'),
    ownership: row.ownership,
    scale: row.scale,
    city: row.city,
    applyUrl: row.apply_url,
    sourceUrl: row.source_url,
    sourceLabel: row.source_label,
    startDate: row.start_date,
    endDate: row.end_date,
    deadlineNote: row.deadline_note,
    recommendation: row.recommendation,
    fitReason: row.fit_reason,
    riskNote: row.risk_note,
    degreeGate: row.degree_gate,
    compensation: row.compensation,
    verifiedAt: row.verified_at,
    stage: row.stage,
    appliedAt: row.applied_at,
    nextActionAt: row.next_action_at,
    notes: row.notes,
    favorite: Boolean(row.favorite),
    archived: Boolean(row.archived),
    isCustom: Boolean(row.is_custom),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  await ensureSchema();
  const ownerId = ownerFrom(request);
  await getD1().batch(
    seedOpportunities
      .filter((item) => !retiredSeedIds.includes(item.id))
      .map((item) => seedStatement(ownerId, item)),
  );
  if (retiredSeedIds.length) {
    await getD1()
      .prepare(
        `DELETE FROM opportunities WHERE owner_id = ? AND is_custom = 0 AND source_id IN (${retiredSeedIds.map(() => '?').join(', ')})`,
      )
      .bind(ownerId, ...retiredSeedIds)
      .run();
  }
  const result = await getD1()
    .prepare(`SELECT * FROM opportunities WHERE owner_id = ? ORDER BY archived, recommendation DESC,
      CASE WHEN end_date IS NULL THEN 1 ELSE 0 END, end_date, company`)
    .bind(ownerId)
    .all<Record<string, unknown>>();
  return Response.json({ opportunities: result.results.map(mapRow) });
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanUrl(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
      ? parsed.toString()
      : '';
  } catch {
    return '';
  }
}

function customStatement(ownerId: string, raw: Record<string, unknown>) {
  const sourceId = cleanString(raw.id) || `custom-${crypto.randomUUID()}`;
  const company = cleanString(raw.company);
  const role = cleanString(raw.role);
  if (!company || !role) throw new Error('企业和岗位不能为空');
  const now = new Date().toISOString();
  const tracks = Array.isArray(raw.tracks)
    ? raw.tracks.map(String).slice(0, 4)
    : [];
  const recommendation = Math.min(
    5,
    Math.max(1, Number(raw.recommendation) || 3),
  );
  return getD1()
    .prepare(`INSERT INTO opportunities (
      row_key, source_id, owner_id, company, role, tracks, ownership, scale, city,
      apply_url, source_url, source_label, start_date, end_date, deadline_note,
      recommendation, fit_reason, risk_note, degree_gate, compensation, verified_at, stage,
      applied_at, next_action_at, notes, favorite, archived, is_custom, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(owner_id, source_id) DO UPDATE SET
      company=excluded.company, role=excluded.role, tracks=excluded.tracks,
      ownership=excluded.ownership, scale=excluded.scale, city=excluded.city,
      apply_url=excluded.apply_url, source_url=excluded.source_url,
      start_date=excluded.start_date, end_date=excluded.end_date,
      deadline_note=excluded.deadline_note, recommendation=excluded.recommendation,
      fit_reason=excluded.fit_reason, risk_note=excluded.risk_note,
      degree_gate=excluded.degree_gate, compensation=excluded.compensation,
      stage=excluded.stage,
      applied_at=excluded.applied_at, next_action_at=excluded.next_action_at,
      notes=excluded.notes, favorite=excluded.favorite, archived=excluded.archived,
      updated_at=excluded.updated_at`)
    .bind(
      rowKey(ownerId, sourceId),
      sourceId,
      ownerId,
      company,
      role,
      JSON.stringify(tracks),
      cleanString(raw.ownership, '私企'),
      cleanString(raw.scale, '中厂'),
      cleanString(raw.city, '待确认'),
      cleanUrl(raw.applyUrl),
      cleanUrl(raw.sourceUrl),
      '手动添加',
      cleanString(raw.startDate) || null,
      cleanString(raw.endDate) || null,
      cleanString(raw.deadlineNote, '手动添加，待核实'),
      recommendation,
      cleanString(raw.fitReason),
      cleanString(raw.riskNote),
      cleanString(raw.degreeGate, '待核实'),
      cleanString(raw.compensation, '未公开'),
      cleanString(raw.verifiedAt, now.slice(0, 10)),
      cleanString(raw.stage, '待投递'),
      cleanString(raw.appliedAt) || null,
      cleanString(raw.nextActionAt) || null,
      cleanString(raw.notes),
      raw.favorite ? 1 : 0,
      raw.archived ? 1 : 0,
      now,
      now,
    );
}

export async function POST(request: Request) {
  await ensureSchema();
  const ownerId = ownerFrom(request);
  const body = (await request.json()) as Record<string, unknown>;
  const rawItems = Array.isArray(body.items) ? body.items : [body];
  if (rawItems.length > 200)
    return Response.json({ error: '一次最多导入200条' }, { status: 400 });
  try {
    await getD1().batch(
      rawItems.map((item) =>
        customStatement(ownerId, item as Record<string, unknown>),
      ),
    );
    return Response.json({ ok: true, count: rawItems.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 400 },
    );
  }
}
