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

test('recommendations exclude internet megafirms; adjacent roles require an explicit exception; private floor is 10K', () => {
  const selected = visible(initial());
  assert.equal(selected.length, 46);
  const internetMegafirms = /字节|美团|拼多多|腾讯|百度|阿里巴巴/;
  for (const item of selected) {
    assert.doesNotMatch(item.company, internetMegafirms);
    if (/项目管理|项目经理|PMO|实施|交付|解决方案|售前|技术支持|营销|Sales100/i.test(item.role)) {
      assert.ok(screeningReviews[item.id].exceptionReason, item.company);
    }
    if (item.ownership === '私企') {
      const review = screeningReviews[item.id];
      if (review.monthlyMin === undefined) {
        assert.ok(review.exceptionReason, item.company);
      } else {
        assert.ok(review.monthlyMin >= 10000, item.company);
        assert.ok(review.salarySourceUrl, item.company);
      }
    }
  }
  assert.ok(selected.some((item) => item.id === 'kylin-product-2027'));
});

test('vivo platform product starts as submitted without overwriting later user progress', () => {
  const firstLoad = initial();
  const vivo = firstLoad.find((item) => item.id === 'vivo-platform-product-2027');
  assert.equal(vivo.stage, '已投递');
  assert.equal(vivo.appliedAt, '2026-09-15');

  vivo.stage = '面试';
  vivo.nextActionAt = '2026-09-22';
  const reloaded = mergeOpportunities(seedOpportunities, firstLoad, now)
    .find((item) => item.id === vivo.id);
  assert.equal(reloaded.stage, '面试');
  assert.equal(reloaded.nextActionAt, '2026-09-22');
});

test('broader-title search adds product engineering and exception candidates with reasons', () => {
  const ids = [
    'engergy-ai-energy-solution-2027',
    'fanruan-fde-ai-solution-2027',
    'siemens-sales100-2027',
    'kehua-digital-energy-2027',
    'ecoflow-presales-2027',
    'nrec-support-2027',
    'sac-power-ai-service-2027',
  ];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(screeningReviews[id].exceptionReason, id);
    assert.ok(new URL(item.applyUrl));
  }
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

test('three large technology companies are screened by role instead of size', () => {
  const ids = ['oppo-ai-pm-2027', 'xiaomi-product-2027', 'anker-campus-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.equal(item.scale, '大型科技企业');
    assert.match(item.degreeGate, /本科/);
    assert.ok(screeningReviews[id].monthlyMin >= 10000, item.company);
    assert.equal(item.verifiedAt, '2026-09-14');
  }
});

test('continued search adds three concrete bachelor roles without delivery work', () => {
  const ids = ['nio-energy-product-2027', 'cmic-ai-product-2027', 'autohome-b2b-product-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.doesNotMatch(item.role, /项目管理|项目经理|PMO|实施|交付/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.equal(item.verifiedAt, '2026-09-14');
  }
  assert.ok(screeningReviews['nio-energy-product-2027'].monthlyMin >= 10000);
  assert.ok(screeningReviews['autohome-b2b-product-2027'].monthlyMin >= 10000);
  assert.equal(screeningReviews['cmic-ai-product-2027'].salaryKind, '未公开');
});

test('latest search adds B2B, AI-security, energy and power-product adjacent roles', () => {
  const ids = [
    'mingyuan-b2b-ai-product-2027',
    'threatbook-ai-product-2027',
    'qiyuan-energy-product-2027',
    'novastar-product-solution-2027',
    'sifang-power-service-2027',
  ];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
  }
  assert.equal(screeningReviews['mingyuan-b2b-ai-product-2027'].monthlyMin, 10000);
  assert.equal(screeningReviews['qiyuan-energy-product-2027'].monthlyMin, 10000);
  assert.equal(screeningReviews['threatbook-ai-product-2027'].salaryKind, '本届公开');
  assert.equal(screeningReviews['novastar-product-solution-2027'].salaryKind, '未公开');
  assert.match(screeningReviews['sifang-power-service-2027'].exceptionReason, /出差|现场/);
});

test('latest search also adds two high-salary AI SaaS product roles', () => {
  const ids = ['beisen-ai-saas-product-2027', 'jiufang-ai-data-product-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.ok(screeningReviews[id].monthlyMin >= 10000);
  }
  assert.equal(screeningReviews['beisen-ai-saas-product-2027'].monthlyMin, 15000);
  assert.equal(screeningReviews['jiufang-ai-data-product-2027'].monthlyMin, 20000);
});

test('October search adds software-solution and industrial-vision product routes', () => {
  const ids = ['hkaco-software-solution-2027', 'shining3d-product-reserve-2027'];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.ok(screeningReviews[id].exceptionReason, id);
  }
  assert.equal(screeningReviews['hkaco-software-solution-2027'].monthlyMin, 15000);
  assert.equal(screeningReviews['shining3d-product-reserve-2027'].monthlyMin, 10000);
});

test('October energy search adds five undergraduate storage and digital-factory routes', () => {
  const ids = [
    'hyperstrong-energy-solution-2027',
    'bluetti-energy-product-2027',
    'inbo-energy-product-engineer-2027',
    'zhiguang-bms-software-2027',
    'xinyueneng-cim-energy-2027',
  ];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.ok(screeningReviews[id].exceptionReason, id);
  }
  assert.equal(screeningReviews['hyperstrong-energy-solution-2027'].monthlyMin, 10000);
  assert.equal(screeningReviews['bluetti-energy-product-2027'].salaryKind, '本届公开');
  assert.equal(screeningReviews['xinyueneng-cim-energy-2027'].salaryKind, '招聘转载参考');
});
