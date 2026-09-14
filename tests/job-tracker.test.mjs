import test from 'node:test';
import assert from 'node:assert/strict';
import { seedOpportunities, retiredSeedIds } from '../lib/opportunities.ts';
import { mergeOpportunities } from '../lib/opportunity-state.ts';
import { isOpportunityInScope, screeningReviews } from '../lib/screening.ts';

const now = '2026-09-10T08:00:00.000Z';
const initial = () => mergeOpportunities(seedOpportunities, [], now);
const visible = (items) => items.filter((item) => isOpportunityInScope(item, retiredSeedIds));

test('every non-retired seed has an explicit screening decision', () => {
  assert.equal(new Set(seedOpportunities.map((item) => item.id)).size, seedOpportunities.length);
  for (const item of seedOpportunities) {
    assert.ok(retiredSeedIds.includes(item.id) || screeningReviews[item.id], item.id);
  }
});

test('new recommendations exclude internet megafirms and project-management roles; private salary floor is 10K', () => {
  const selected = visible(initial());
  assert.equal(selected.length, 12);
  const internetMegafirms = /字节|美团|拼多多|腾讯|百度|阿里巴巴/;
  for (const item of selected) {
    assert.doesNotMatch(item.company, internetMegafirms);
    assert.doesNotMatch(item.role, /项目管理|项目经理|PMO|实施|交付/);
    if (item.ownership === '私企') {
      assert.ok(screeningReviews[item.id].monthlyMin >= 10000, item.company);
      assert.ok(screeningReviews[item.id].salarySourceUrl, item.company);
    }
  }
  assert.ok(selected.some((item) => item.id === 'kylin-product-2027'));
});

test('preparing and already-submitted old entries survive new curation and reload', () => {
  for (const stage of ['准备中', '已投递', '笔试', '面试', 'Offer', '已拒绝']) {
    const stored = initial();
    const old = stored.find((item) => item.id === 'sany-digital-energy-2027');
    Object.assign(old, { stage, notes: '自己的备注', favorite: true, nextActionAt: '2026-09-20' });
    const reloaded = mergeOpportunities(seedOpportunities, stored, now);
    const preserved = visible(reloaded).find((item) => item.id === old.id);
    assert.ok(preserved, stage);
    assert.equal(preserved.stage, stage);
    assert.equal(preserved.notes, '自己的备注');
    assert.equal(preserved.favorite, true);
    assert.equal(preserved.nextActionAt, '2026-09-20');
  }
});

test('abandoned entries never reappear after refresh, including imported seeds', () => {
  const stored = initial();
  const abandoned = stored.find((item) => item.id === 'huice-b2b-product-2027');
  Object.assign(abandoned, { stage: '放弃', isCustom: true, notes: '没有适合岗位' });
  const reloaded = mergeOpportunities(seedOpportunities, stored, now);
  assert.equal(reloaded.filter((item) => item.id === abandoned.id).length, 1);
  assert.equal(visible(reloaded).some((item) => item.id === abandoned.id), false);
  assert.equal(reloaded.find((item) => item.id === abandoned.id).notes, '没有适合岗位');
});

test('retired seeds cannot be revived as custom records and history is not deleted', () => {
  const stored = initial();
  const old = stored.find((item) => item.id === 'sungrow-campus-2027');
  Object.assign(old, { isCustom: true, stage: '准备中', notes: '保留备份' });
  const reloaded = mergeOpportunities(seedOpportunities, stored, now);
  assert.equal(reloaded.filter((item) => item.id === old.id).length, 1);
  assert.ok(!visible(reloaded).some((item) => item.id === old.id));
  assert.equal(reloaded.find((item) => item.id === old.id).notes, '保留备份');
});

test('custom entries, archive flags, dates and empty notes are preserved', () => {
  const stored = initial();
  const custom = { ...stored[0], id: 'custom-example', isCustom: true, company: '手动添加企业', archived: true, notes: '', appliedAt: '2026-09-09' };
  const reloaded = mergeOpportunities(seedOpportunities, [...stored, custom], now);
  assert.deepEqual(reloaded.find((item) => item.id === custom.id), custom);
  assert.equal(reloaded.filter((item) => item.id === custom.id).length, 1);
});

test('five newly verified companies have concrete bachelor product roles', () => {
  const ids = ['ronds-software-product-2027', 'huice-b2b-product-2027', 'intsig-data-product-2027', 'kylin-product-2027', 'richinfo-ai-product-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((item) => item.id === id);
    assert.ok(item && screeningReviews[id].eligible);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
  }
  assert.equal(seedOpportunities.find((item) => item.id === 'richinfo-ai-product-2027').verifiedAt, '2026-09-14');
});

test('three re-screened industrial tech companies have concrete product opportunities', () => {
  const ids = ['envision-product-2027', 'lalamove-strategy-product-2027', 'ninebot-navimow-product-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(screeningReviews[id].monthlyMin >= 10000, item.company);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
  }
});
