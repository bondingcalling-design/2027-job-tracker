import { getD1, ensureSchema } from '@/db';

export const dynamic = 'force-dynamic';

function ownerFrom(request: Request) {
  return (
    request.headers.get('oai-authenticated-user-id') ||
    request.headers.get('oai-authenticated-user-email') ||
    'local-dev'
  );
}

const allowedFields: Record<string, string> = {
  company: 'company',
  role: 'role',
  tracks: 'tracks',
  ownership: 'ownership',
  scale: 'scale',
  city: 'city',
  applyUrl: 'apply_url',
  sourceUrl: 'source_url',
  startDate: 'start_date',
  endDate: 'end_date',
  deadlineNote: 'deadline_note',
  recommendation: 'recommendation',
  fitReason: 'fit_reason',
  riskNote: 'risk_note',
  degreeGate: 'degree_gate',
  compensation: 'compensation',
  verifiedAt: 'verified_at',
  stage: 'stage',
  appliedAt: 'applied_at',
  nextActionAt: 'next_action_at',
  notes: 'notes',
  favorite: 'favorite',
  archived: 'archived',
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const ownerId = ownerFrom(request);
  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [field, column] of Object.entries(allowedFields)) {
    if (!(field in body)) continue;
    let value = body[field];
    if (field === 'tracks')
      value = JSON.stringify(
        Array.isArray(value) ? value.map(String).slice(0, 4) : [],
      );
    if (field === 'favorite' || field === 'archived') value = value ? 1 : 0;
    if (field === 'recommendation')
      value = Math.min(5, Math.max(1, Number(value) || 3));
    if (
      ['startDate', 'endDate', 'appliedAt', 'nextActionAt'].includes(field) &&
      value === ''
    )
      value = null;
    assignments.push(`${column} = ?`);
    values.push(value);
  }

  if (!assignments.length)
    return Response.json({ error: '没有可更新字段' }, { status: 400 });
  assignments.push('updated_at = ?');
  values.push(new Date().toISOString(), ownerId, decodeURIComponent(id));
  const result = await getD1()
    .prepare(
      `UPDATE opportunities SET ${assignments.join(', ')} WHERE owner_id = ? AND source_id = ?`,
    )
    .bind(...values)
    .run();
  if (!result.meta.changes)
    return Response.json({ error: '记录不存在' }, { status: 404 });
  return Response.json({ ok: true });
}
