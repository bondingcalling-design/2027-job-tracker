import test from 'node:test';
import assert from 'node:assert/strict';
import { seedOpportunities, retiredSeedIds } from '../lib/opportunities.ts';
import { mergeOpportunities, normalizeCompanyName } from '../lib/opportunity-state.ts';
import { chinaToday, deadlineCountdown, getDeadlineTime, getPreferredCityNote, isDeadlineExpired, isOpportunityInScope, locationExclusions, screeningReviews } from '../lib/screening.ts';

const now = '2026-09-10T08:00:00.000Z';
const initial = () => mergeOpportunities(seedOpportunities, [], now);
const visible = (items) => items.filter((item) => isOpportunityInScope(item, retiredSeedIds, '2026-10-19'));

test('verified 17:00 deadlines close in China time rather than waiting until midnight', () => {
  const row = initial().find((item) => item.id === 'sinopec-zhejiang-ai-2027');
  const before = Date.parse('2026-10-28T16:59:59+08:00');
  const cutoff = Date.parse('2026-10-28T17:00:00+08:00');
  assert.equal(getDeadlineTime(row), '17:00');
  assert.equal(isDeadlineExpired(row, before), false);
  assert.equal(deadlineCountdown(row, before), '剩1分钟');
  assert.equal(isOpportunityInScope(row, retiredSeedIds, undefined, before), true);
  assert.equal(isDeadlineExpired(row, cutoff), true);
  assert.equal(deadlineCountdown(row, cutoff), '已截止');
  assert.equal(isOpportunityInScope(row, retiredSeedIds, undefined, cutoff), false);
  assert.equal(chinaToday(Date.parse('2026-10-27T16:01:00Z')), '2026-10-28');
});

test('a precise deadline never deletes preparing or interview progress and cannot revive abandoned cards', () => {
  const original = initial().find((item) => item.id === 'sinopec-jiangsu-ai-2027');
  const cutoff = Date.parse('2026-10-28T17:00:00+08:00');
  for (const stage of ['准备中', '已投递', '笔试', '面试', 'Offer']) {
    const saved = { ...original, stage, notes: '我已记录的进度', nextActionAt: '2026-11-01' };
    const restored = mergeOpportunities(seedOpportunities, [saved]).find((item) => item.id === original.id);
    assert.equal(restored.stage, stage);
    assert.equal(restored.notes, saved.notes);
    assert.equal(restored.nextActionAt, saved.nextActionAt);
    assert.equal(isOpportunityInScope(restored, retiredSeedIds, undefined, cutoff), true);
    assert.equal(isDeadlineExpired(restored, cutoff), true);
  }
  assert.equal(isOpportunityInScope({ ...original, stage: '放弃' }, retiredSeedIds, undefined, cutoff - 1), false);
});

test('unknown cutoff times do not receive a fabricated midnight countdown', () => {
  const row = { endDate: '2026-10-28' };
  const late = Date.parse('2026-10-28T23:59:59+08:00');
  assert.equal(getDeadlineTime(row), null);
  assert.equal(isDeadlineExpired(row, late), false);
  assert.equal(deadlineCountdown(row, late), '今天截止 · 时刻未公布');
  assert.equal(isDeadlineExpired(row, Date.parse('2026-10-29T00:00:00+08:00')), true);
  assert.equal(getDeadlineTime({ ...row, endTime: '99:99' }), null);
  assert.equal(deadlineCountdown({ endDate: null, endTime: '17:00' }, late), '截止未公布');
});

test('verified 24:00 and noon deadlines keep their literal boundary', () => {
  const midnight = { endDate: '2026-11-06', endTime: '24:00' };
  assert.equal(getDeadlineTime(midnight), '24:00');
  assert.equal(isDeadlineExpired(midnight, Date.parse('2026-11-06T23:59:59+08:00')), false);
  assert.equal(isDeadlineExpired(midnight, Date.parse('2026-11-07T00:00:00+08:00')), true);
  const noon = seedOpportunities.find((item) => item.id === 'yzw-procurement-product-trainee-2027');
  assert.equal(noon.endTime, '12:00');
  assert.equal(isDeadlineExpired(noon, Date.parse('2027-06-15T12:00:00+08:00')), true);
});

test('October 28 adds a distinct official bachelor AI knowledge-product role without treating a placeholder as a deadline', () => {
  const seed = seedOpportunities.find((item) => item.id === 'cmft-enterprise-ai-product-2027');
  assert.ok(seed && screeningReviews[seed.id].eligible);
  assert.equal(seed.city, '深圳');
  assert.equal(seed.ownership, '央企');
  assert.match(seed.degreeGate, /2027届本科/);
  assert.match(seed.fitReason, /知识库|RAG/);
  assert.match(seed.applyUrl, /^https:\/\/cmhk\.zhiye\.com\/campus\/detail/);
  assert.equal(seed.endDate, null);
  assert.equal(seed.startDate, null);
  assert.match(seed.compensation, /面议/);
  assert.equal(screeningReviews[seed.id].salaryKind, '未公开');
  assert.equal(initial().filter((item) => normalizeCompanyName(item.company) === normalizeCompanyName(seed.company)).length, 1);
});

test('every non-retired seed has an explicit screening decision', () => {
  assert.equal(new Set(seedOpportunities.map((item) => item.id)).size, seedOpportunities.length);
  for (const item of seedOpportunities) {
    assert.ok(retiredSeedIds.includes(item.id) || screeningReviews[item.id], item.id);
  }
});

test('four further employers keep real bachelor roles and distinguish product work from coding-heavy alternatives', () => {
  const ids = ['wepie-backoffice-product-2027', 'yealink-product-manager-2027', 'sdic-intelligence-agent-xiamen-2027', 'ccssoft-agent-chengdu-2027'];
  const fresh = initial();
  for (const id of ids) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.ok(seed && screeningReviews[id].eligible, id);
    assert.match(seed.degreeGate, /本科/);
    assert.doesNotMatch(seed.city, /北京|西安|昆明/);
    assert.equal(fresh.filter((item) => normalizeCompanyName(item.company) === normalizeCompanyName(seed.company)).length, 1);
    assert.equal(seed.initialStage, undefined);
  }
  const wepie = seedOpportunities.find((item) => item.id === ids[0]);
  assert.deepEqual(wepie.tracks, ['B端软件/平台']);
  assert.equal(screeningReviews[wepie.id].monthlyMin, 10500);
  assert.match(wepie.riskNote, /不是已证实的能源或RAG产品/);
  const yealink = seedOpportunities.find((item) => item.id === ids[1]);
  assert.equal(yealink.city, '厦门');
  assert.match(yealink.degreeGate, /CET6/);
  assert.equal(screeningReviews[yealink.id].salaryKind, '往届参考');
  assert.match(yealink.compensation, /非本届.*原BOSS未复核/);
  for (const id of ids.slice(2)) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.equal(seed.ownership, '央企');
    assert.match(seed.role, /开发/);
    assert.match(seed.riskNote, /Python|Java/);
    assert.equal(screeningReviews[id].salaryKind, '未公开');
    assert.equal(screeningReviews[id].monthlyMin, undefined);
    assert.ok(seed.recommendation <= 3);
  }
});

test('new role dates do not inherit a page expiry, placeholder or another subsidiary deadline', () => {
  for (const id of ['wepie-backoffice-product-2027', 'yealink-product-manager-2027', 'sdic-intelligence-agent-xiamen-2027', 'ccssoft-agent-chengdu-2027']) {
    const row = initial().find((item) => item.id === id);
    assert.equal(row.startDate, null, id);
    assert.equal(row.endDate, null, id);
    assert.equal(deadlineCountdown(row, Date.parse('2026-10-28T18:00:00+08:00')), '截止未公布');
  }
  assert.match(seedOpportunities.find((item) => item.id === 'wepie-backoffice-product-2027').deadlineNote, /11月8日是页面过期/);
  assert.match(seedOpportunities.find((item) => item.id === 'ccssoft-agent-chengdu-2027').deadlineNote, /不套四川通服10月30日/);
});

test('further employer legal names do not duplicate an existing manual decision or merge distinct subsidiaries', () => {
  const cases = [
    ['wepie-backoffice-product-2027', '武汉微派网络科技有限公司'],
    ['yealink-product-manager-2027', '厦门亿联网络技术股份有限公司'],
    ['sdic-intelligence-agent-xiamen-2027', '国投智能（厦门）信息股份有限公司'],
    ['sdic-intelligence-agent-xiamen-2027', '美亚柏科'],
    ['ccssoft-agent-chengdu-2027', '中通服软件科技有限公司'],
  ];
  for (const [id, company] of cases) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.equal(normalizeCompanyName(seed.company), normalizeCompanyName(company));
    for (const stage of ['准备中', '面试', '放弃']) {
      const manual = { ...freshStored(seed), id: `manual-${id}`, company, stage, notes: '已有记录及决定', favorite: true, isCustom: true };
      const restored = mergeOpportunities(seedOpportunities, [manual], now);
      assert.equal(restored.some((item) => item.id === id), false);
      assert.deepEqual(restored.find((item) => item.id === manual.id), manual);
    }
  }
  assert.notEqual(normalizeCompanyName('中通服软件'), normalizeCompanyName('上海信产通信服务培训中心'));
  assert.notEqual(normalizeCompanyName('中通服软件'), normalizeCompanyName('中数通信息'));
});

test('October 28 expansion keeps distinct bachelor routes and distinguishes reference pay from a confirmed offer', () => {
  const ids = [
    'ths-aime-agent-product-2027', 'dewu-supplychain-ai-platform-2027',
    'coli-commercial-saas-product-2027', 'aspire-ai-application-guangzhou-2027',
    'csg-ecosystem-ict-guangzhou-2027', 'finvolution-product-ph-2027',
  ];
  const fresh = initial();
  for (const id of ids) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.ok(seed && screeningReviews[id].eligible, id);
    assert.match(seed.degreeGate, /本科/);
    assert.doesNotMatch(seed.city, /北京|西安/);
    assert.equal(seed.initialStage, undefined);
    assert.equal(seed.initialAppliedAt, undefined);
    assert.equal(fresh.filter((item) => normalizeCompanyName(item.company) === normalizeCompanyName(seed.company)).length, 1);
    if (seed.ownership === '私企') {
      assert.ok(screeningReviews[id].monthlyMin >= 10000, id);
      assert.ok(screeningReviews[id].salarySourceUrl, id);
    }
  }
  assert.equal(screeningReviews[ids[0]].salaryKind, '往届参考');
  assert.match(seedOpportunities.find((item) => item.id === ids[0]).compensation, /历史.*届别未标/);
  assert.equal(screeningReviews[ids[1]].salaryKind, '招聘转载参考');
  assert.match(seedOpportunities.find((item) => item.id === ids[1]).degreeGate, /物联网/);
  assert.match(seedOpportunities.find((item) => item.id === ids[1]).compensation, /用户产品经理.*子方向未披露/);
  const finvolution = seedOpportunities.find((item) => item.id === ids[5]);
  assert.deepEqual(finvolution.tracks, ['其他产品备选']);
  assert.match(finvolution.sourceLabel, /非|不是/);
  assert.match(finvolution.riskNote, /出差.*派驻/);
});

test('new cutoff evidence does not spread another job or platform validity period to the target role', () => {
  for (const id of ['ths-aime-agent-product-2027', 'dewu-supplychain-ai-platform-2027', 'coli-commercial-saas-product-2027', 'aspire-ai-application-guangzhou-2027', 'finvolution-product-ph-2027']) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.equal(seed.startDate, null, id);
    assert.equal(seed.endDate, null, id);
    assert.equal(getDeadlineTime(seed), null, id);
  }
  const grid = initial().find((item) => item.id === 'csg-ecosystem-ict-guangzhou-2027');
  assert.equal(grid.endDate, '2026-11-02');
  assert.equal(grid.endTime, '24:00');
  assert.match(grid.role, /职责待登录核对/);
  assert.match(grid.riskNote, /尚不能区分产品、开发或运维/);
  assert.equal(screeningReviews[grid.id].monthlyMin, undefined);
  assert.equal(isDeadlineExpired(grid, Date.parse('2026-11-02T23:59:59+08:00')), false);
  assert.equal(isOpportunityInScope(grid, retiredSeedIds, undefined, Date.parse('2026-11-03T00:00:00+08:00')), false);
});

test('new employer aliases respect an existing interview or abandoned decision rather than creating another card', () => {
  const cases = [
    ['ths-aime-agent-product-2027', '浙江核新同花顺网络信息股份有限公司'],
    ['dewu-supplychain-ai-platform-2027', '得物App'],
    ['dewu-supplychain-ai-platform-2027', '上海得物信息集团有限公司'],
    ['aspire-ai-application-guangzhou-2027', '卓望数码技术（深圳）有限公司'],
    ['finvolution-product-ph-2027', '上海耳序信息技术有限公司'],
  ];
  for (const [id, alias] of cases) {
    const seed = seedOpportunities.find((item) => item.id === id);
    assert.equal(normalizeCompanyName(alias), normalizeCompanyName(seed.company));
    for (const stage of ['面试', '放弃']) {
      const manual = { ...freshStored(seed), id: `manual-${id}`, company: alias, stage, notes: '已有决定', favorite: true, isCustom: true };
      const merged = mergeOpportunities(seedOpportunities, [manual], now);
      assert.equal(merged.some((item) => item.id === id), false);
      assert.deepEqual(merged.find((item) => item.id === manual.id), manual);
    }
  }
  assert.notEqual(normalizeCompanyName('中国移动终端公司'), normalizeCompanyName('卓望'));
  assert.notEqual(normalizeCompanyName('南网互联网服务有限公司'), normalizeCompanyName('南方电网用户生态运营公司'));
});

function freshStored(seed) {
  return { ...seed, compensation: seed.compensation || '未公开', stage: '待投递', appliedAt: null, nextActionAt: null, notes: '', favorite: false, archived: false, isCustom: false };
}

test('Kylin Shanghai refresh preserves personal progress and uses its own verified deadline', () => {
  const seed = seedOpportunities.find((item) => item.id === 'kylin-product-2027');
  assert.match(seed.role, /产品经理-SH/);
  assert.match(seed.city, /上海/);
  assert.doesNotMatch(seed.city, /北京|西安/);
  assert.equal(seed.endDate, '2026-11-18');
  assert.equal(seed.endTime, '24:00');
  assert.equal(seed.startDate, null);
  assert.equal(seed.tracks.includes('AI应用产品'), false);
  assert.match(seed.riskNote, /并非RAG产品/);
  assert.match(seed.deadlineNote, /原其他城市不能套此期限/);
  const previous = { ...freshStored(seed), stage: '面试', notes: '原城市回执及备注', appliedAt: '2026-10-20', nextActionAt: '2026-11-01', favorite: true, createdAt: '2026-09-10', updatedAt: '2026-10-20' };
  const saved = mergeOpportunities(seedOpportunities, [previous], now).find((item) => item.id === seed.id);
  for (const field of ['stage', 'notes', 'appliedAt', 'nextActionAt', 'favorite', 'createdAt', 'updatedAt']) {
    assert.equal(saved[field], previous[field], field);
  }
  assert.equal(isOpportunityInScope(saved, retiredSeedIds, '2026-11-19'), true);
});

test('October 27 deadline additions are distinct undergraduate SOE units with honest salary fields', () => {
  const ids = ['sinopec-zhejiang-ai-2027', 'sinopec-jiangsu-ai-2027', 'cofco-dongguan-ai-engineer-trainee-2027'];
  const fresh = initial();
  for (const id of ids) {
    const item = seedOpportunities.find((seed) => seed.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.equal(item.ownership, '央企');
    assert.match(item.degreeGate, /本科/);
    assert.doesNotMatch(item.city, /北京|西安/);
    assert.equal(item.endDate, '2026-10-28');
    assert.equal(item.verifiedAt, '2026-10-27');
    assert.equal(screeningReviews[id].salaryKind, '未公开');
    assert.equal(screeningReviews[id].monthlyMin, undefined);
    assert.equal(fresh.filter((row) => normalizeCompanyName(row.company) === normalizeCompanyName(item.company)).length, 1);
    const row = fresh.find((entry) => entry.id === id);
    assert.equal(isOpportunityInScope(row, retiredSeedIds, '2026-10-27'), true);
    assert.equal(isOpportunityInScope(row, retiredSeedIds, '2026-10-29'), false);
    assert.equal(isOpportunityInScope({ ...row, stage: '准备中' }, retiredSeedIds, '2026-10-29'), true);
  }
  for (const id of ids.slice(0, 2)) {
    const item = seedOpportunities.find((seed) => seed.id === id);
    assert.match(item.degreeGate, /物联网/);
    assert.match(item.deadlineNote, /17:00/);
    assert.match(item.deadlineNote, /最多2岗/);
    assert.match(item.riskNote, /一线/);
  }
  const cofco = seedOpportunities.find((seed) => seed.id === ids[2]);
  assert.match(cofco.city, /东莞/);
  assert.match(cofco.riskNote, /现场|产线/);
  assert.match(cofco.riskNote, /未被直接点名/);
  assert.match(cofco.compensation, /薪资未公开/);
  assert.match(cofco.deadlineNote, /未注明具体时刻/);
});

test('deadline corrections preserve saved progress and distinguish sourced dates from page validity', () => {
  const fresh = initial();
  const group = fresh.find((row) => row.id === 'sgdt-ai-energy-digital-2027');
  assert.equal(screeningReviews[group.id].eligible, false);
  assert.match(group.city, /雄安/);
  assert.doesNotMatch(group.city, /上海|浙江|湖北|广东/);
  assert.equal(isOpportunityInScope(group, retiredSeedIds, '2026-10-27'), false);
  const saved = { ...group, stage: '面试', notes: '保留我的面试备注', favorite: true };
  const merged = mergeOpportunities(seedOpportunities, [saved], '2026-10-27T08:00:00.000Z');
  const kept = merged.find((row) => row.id === group.id);
  assert.equal(kept.stage, '面试');
  assert.equal(kept.notes, saved.notes);
  assert.equal(kept.favorite, true);
  assert.equal(isOpportunityInScope(kept, retiredSeedIds, '2026-10-27'), true);
  const bank = seedOpportunities.find((seed) => seed.id === 'nbcb-fintech-product-2027');
  assert.equal(bank.endDate, '2026-10-31');
  assert.match(bank.deadlineNote, /完整招聘信息转载/);
  assert.match(bank.riskNote, /与实际岗位分配无关/);
  assert.equal(bank.recommendation, 3);
  const ygsoft = seedOpportunities.find((seed) => seed.id === 'ygsoft-ai-requirements-2027');
  assert.equal(ygsoft.endDate, '2026-10-30');
  assert.match(ygsoft.deadlineNote, /12月8日是页面有效期/);
});

test('October 19 SOE additions use verified undergraduate roles and do not invent a cutoff', () => {
  const tower = seedOpportunities.find((item) => item.id === 'chinatower-tianjin-aiot-2027');
  const cicdi = seedOpportunities.find((item) => item.id === 'cicdi-data-elements-2027');
  assert.ok(tower && cicdi);
  assert.equal(tower.endDate, '2026-10-27');
  assert.equal(cicdi.endDate, null);
  assert.match(tower.degreeGate, /计算机类/);
  assert.match(cicdi.degreeGate, /计算机科学与技术/);
  assert.match(cicdi.city, /南京/);
  assert.ok(screeningReviews[tower.id].eligible);
  assert.ok(screeningReviews[cicdi.id].eligible);
  assert.equal(seedOpportunities.filter((item) => item.company === tower.company).length, 1);
  assert.equal(seedOpportunities.filter((item) => item.company === cicdi.company).length, 1);
});

test('recommendations exclude internet megafirms; adjacent roles require an explicit exception; private floor is 10K', () => {
  const selected = visible(initial());
  assert.equal(selected.length, 90);
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

test('October 21 follow-up adds four distinct subsidiary product roles with honest salary and deadline fields', () => {
  const ids = [
    'hptpd-ai-product-assistant-2027',
    'chinacomsrv-guangzhou-product-2027',
    'shccs-training-ai-product-2027',
    'yzw-procurement-product-trainee-2027',
  ];
  const fresh = initial();
  for (const id of ids) {
    const item = seedOpportunities.find((seed) => seed.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.equal(item.ownership, '央企');
    assert.match(item.degreeGate, /本科/);
    assert.doesNotMatch(item.city, /北京|西安/);
    assert.equal(item.verifiedAt, '2026-10-21');
    assert.equal(screeningReviews[id].salaryKind, '未公开');
    assert.equal(screeningReviews[id].monthlyMin, undefined);
    assert.equal(fresh.filter((row) => normalizeCompanyName(row.company) === normalizeCompanyName(item.company)).length, 1);
    assert.equal(isOpportunityInScope(fresh.find((row) => row.id === id), retiredSeedIds, '2026-10-21'), true);
  }
  for (const id of ids.slice(0, 3)) {
    const item = seedOpportunities.find((seed) => seed.id === id);
    assert.match(item.applyUrl, /^https:\/\/job\.chinatelecom\.com\.cn\//);
    assert.equal(item.endDate, null);
  }
  const cloud = seedOpportunities.find((seed) => seed.id === ids[3]);
  assert.equal(cloud.endDate, '2027-06-15');
  assert.match(cloud.deadlineNote, /12:00/);
  assert.match(cloud.riskNote, /硕士/);
  assert.match(seedOpportunities.find((seed) => seed.id === ids[0]).fitReason, /RAG/);
});

test('new subsidiary seeds respect same-employer abandoned and interview decisions', () => {
  for (const [id, stage] of [['hptpd-ai-product-assistant-2027', '放弃'], ['yzw-procurement-product-trainee-2027', '面试']]) {
    const seed = seedOpportunities.find((item) => item.id === id);
    const manual = {
      ...seed, id: `manual-${id}`, compensation: '用户已有待遇备注',
      stage, appliedAt: null, nextActionAt: null, notes: '已有决定，不新增重复卡片',
      favorite: false, archived: false, isCustom: true,
    };
    const reloaded = mergeOpportunities(seedOpportunities, [manual], now);
    assert.equal(reloaded.some((row) => row.id === id), false);
    assert.equal(reloaded.find((row) => row.id === manual.id).stage, stage);
    assert.equal(reloaded.find((row) => row.id === manual.id).notes, manual.notes);
  }
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

test('October AI product search adds three concrete undergraduate routes without duplicating prior companies', () => {
  const ids = [
    'flypai-ai-agent-product-2027',
    'xiaopeng-embodied-data-product-2027',
    'spirit-ai-product-2027',
  ];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
  }
  assert.equal(screeningReviews['xiaopeng-embodied-data-product-2027'].monthlyMin, 12500);
  assert.equal(screeningReviews['flypai-ai-agent-product-2027'].salaryKind, '未公开');
  assert.equal(screeningReviews['spirit-ai-product-2027'].salaryKind, '未公开');
});

test('bank review keeps the three valid undergraduate routes from the first batch', () => {
  const keptIds = [
    'hzbank-ai-tech-2027', 'nbcb-fintech-product-2027', 'citic-card-product-ai-2027',
  ];
  const retiredIds = [
    'boc-digital-tech-2027', 'cmb-chengdu-digital-finance-2027', 'suzhou-bank-ai-tech-2027',
  ];
  for (const id of keptIds) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.match(item.deadlineNote, /截止|截至|结束|滚动|状态/);
  }
  assert.equal(screeningReviews['hzbank-ai-tech-2027'].monthlyMin, 10000);
  assert.equal(screeningReviews['citic-card-product-ai-2027'].monthlyMin, 10000);
  assert.equal(screeningReviews['nbcb-fintech-product-2027'].monthlyMin, 10000);
  assert.equal(seedOpportunities.find((item) => item.id === 'nbcb-fintech-product-2027').recommendation, 3);
  for (const id of retiredIds) {
    assert.ok(retiredSeedIds.includes(id), id);
    assert.equal(screeningReviews[id].eligible, false, id);
  }
  assert.equal(seedOpportunities.some((item) => item.id === 'cloudview-browser-ai-product-2027'), false);
  assert.equal(seedOpportunities.some((item) => item.id === 'autohome-ai-agent-product-2027'), false);
});

test('October follow-up retains three eligible logistics-tech and energy routes after Dalian re-screening', () => {
  const keptIds = [
    'sf-tech-product-data-2027',
    'bankofbeijing-ai-tech-2027',
    'mingyang-smart-energy-ai-2027',
  ];
  for (const id of keptIds) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.match(item.deadlineNote, /截止|截至|结束|滚动|状态/);
  }
  assert.equal(screeningReviews['sf-tech-product-data-2027'].monthlyMin, 20000);
  assert.equal(screeningReviews['bankcomm-fintech-2027'].monthlyMin, 10500);
  assert.equal(screeningReviews['bankcomm-fintech-2027'].eligible, false);
  assert.equal(screeningReviews['bankofbeijing-ai-tech-2027'].salaryKind, '招聘转载参考');
  assert.equal(screeningReviews['mingyang-smart-energy-ai-2027'].salaryKind, '往届参考');
  assert.ok(retiredSeedIds.includes('cgb-fintech-product-2027'));
  assert.equal(screeningReviews['cgb-fintech-product-2027'].eligible, false);
});

test('October 9 batch retains eight routes after subsequent bank and location audits', () => {
  const ids = [
    'ztccloud-b2b-product-2027',
    'seichitech-product-information-2027',
    'kingdee-ai-product-2027',
    'goldwind-product-rd-2027',
    'nsfocus-security-product-2027',
    'ygsoft-ai-requirements-2027',
    'czbank-ai-application-2027',
    'huaneng-beijing-digital-2027',
  ];
  assert.equal(ids.length, 8);
  assert.equal(new Set(ids).size, 8);
  const companies = new Set();
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.match(item.verifiedAt, /^2026-10-(09|12|27)$/);
    assert.equal(companies.has(item.company), false, item.company);
    companies.add(item.company);
  }
  for (const id of ['ztccloud-b2b-product-2027', 'seichitech-product-information-2027', 'kingdee-ai-product-2027', 'goldwind-product-rd-2027', 'nsfocus-security-product-2027']) {
    assert.ok(screeningReviews[id].monthlyMin >= 10000, id);
  }
  for (const id of ['ygsoft-ai-requirements-2027', 'sgdt-ai-energy-digital-2027', 'czbank-ai-application-2027', 'huaneng-beijing-digital-2027']) {
    assert.match(seedOpportunities.find((item) => item.id === id).deadlineNote, /截止|截至/);
  }
  assert.ok(retiredSeedIds.includes('cmbc-tech-ai-development-2027'));
  assert.equal(screeningReviews['cmbc-tech-ai-development-2027'].eligible, false);
});

test('October 12 bank audit removes expired, master-only, low-pay and resume-mismatched entries', () => {
  const keptIds = [
    'czbank-ai-application-2027',
    'hzbank-ai-tech-2027',
    'nbcb-fintech-product-2027',
    'citic-card-product-ai-2027',
    'bankofbeijing-ai-tech-2027',
  ];
  const removedIds = [
    'boc-digital-tech-2027',
    'cmb-chengdu-digital-finance-2027',
    'suzhou-bank-ai-tech-2027',
    'cgb-fintech-product-2027',
    'cmbc-tech-ai-development-2027',
  ];
  for (const id of keptIds) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.equal(item.verifiedAt, item.id === 'nbcb-fintech-product-2027' ? '2026-10-28' : '2026-10-12');
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    if (screeningReviews[id].monthlyMin !== undefined) {
      assert.ok(screeningReviews[id].monthlyMin >= 10000, id);
    }
  }
  for (const id of removedIds) {
    assert.ok(retiredSeedIds.includes(id), id);
    assert.equal(screeningReviews[id].eligible, false, id);
    assert.equal(visible(initial()).some((item) => item.id === id), false, id);
  }
  assert.match(seedOpportunities.find((item) => item.id === 'nbcb-fintech-product-2027').role, /产品经理/);
  assert.match(seedOpportunities.find((item) => item.id === 'bankcomm-fintech-2027').role, /产品方向未确认/);
  assert.match(seedOpportunities.find((item) => item.id === 'bankofbeijing-ai-tech-2027').role, /AI产品经理/);
});

test('latest review keeps only four high-confidence computer-major product routes', () => {
  const keptIds = [
    'pylontech-cloud-product-2027',
    'pudurobotics-product-manager-2027',
    'cnnc-huahui-ai-product-2027',
    'streamax-platform-product-2027',
  ];
  const removedIds = [
    'hundsun-requirements-ai-2027',
    'techen-ai-energy-application-2027',
    'iwhalecloud-product-trainee-2027',
    'sundray-enterprise-ai-development-2027',
    'rigol-it-ai-application-2027',
    'chinsoft-requirements-analysis-2027',
  ];
  assert.equal(keptIds.length, 4);
  const companies = new Set();
  for (const id of keptIds) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.match(item.degreeGate, /计算机|信息技术|软件|人工智能/);
    assert.doesNotMatch(item.company, /银行/);
    assert.doesNotMatch(item.role, /电气|电力专业|项目管理|项目经理|PMO|实施交付/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.equal(item.verifiedAt, '2026-10-09');
    assert.equal(companies.has(item.company), false, item.company);
    companies.add(item.company);
    assert.equal(seedOpportunities.filter((seed) => seed.company === item.company).length, 1, item.company);
    if (item.ownership === '私企') {
      assert.ok(screeningReviews[id].monthlyMin >= 10000, item.company);
      assert.ok(screeningReviews[id].salarySourceUrl, item.company);
    }
  }
  for (const id of removedIds) {
    assert.ok(retiredSeedIds.includes(id), id);
    assert.equal(visible(initial()).some((item) => item.id === id), false, id);
  }
});

test('October 13 SOE review adds only concrete undergraduate computer routes', () => {
  const ids = [
    'xiangyu-digital-operations-2027',
    'huali-ai-system-2027',
    'scc-software-digital-2027',
  ];
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.match(item.degreeGate, /本科/);
    assert.match(item.degreeGate, /计算机/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.equal(item.verifiedAt, '2026-10-13');
    assert.match(item.deadlineNote, /截止|滚动/);
    assert.notEqual(item.ownership, '私企');
  }
  assert.equal(seedOpportunities.filter((item) => /深南电路|上海华力|厦门象屿/.test(item.company)).length, 3);
  assert.equal(seedOpportunities.find((item) => item.id === 'xiangyu-digital-operations-2027').recommendation, 5);
  assert.match(seedOpportunities.find((item) => item.id === 'huali-ai-system-2027').riskNote, /运维/);
  assert.match(seedOpportunities.find((item) => item.id === 'scc-software-digital-2027').riskNote, /不是产品经理/);
});

test('October 14 employer review keeps Uniview conditional and INVT as a low-priority welfare exception', () => {
  const item = seedOpportunities.find((opportunity) => opportunity.id === 'uniview-ai-software-energy-product-2027');
  assert.ok(item);
  assert.equal(item.company, '宇视科技');
  assert.equal(item.verifiedAt, '2026-10-14');
  assert.match(item.role, /AI软件开发工程师.*储能产品经理/);
  assert.match(item.degreeGate, /具体岗位.*未公开/);
  assert.equal(screeningReviews[item.id].salaryKind, '未公开');
  assert.equal(screeningReviews[item.id].monthlyMin, undefined);
  assert.equal(seedOpportunities.filter((opportunity) => opportunity.company === '宇视科技').length, 1);
  const invt = seedOpportunities.find((opportunity) => opportunity.id === 'invt-it-development-2027');
  assert.ok(invt);
  assert.equal(invt.company, '英威腾');
  assert.equal(invt.recommendation, 2);
  assert.match(invt.degreeGate, /计算机/);
  assert.match(invt.compensation, /薪资未公开/);
  assert.match(screeningReviews[invt.id].exceptionReason, /福利破格/);
  assert.equal(screeningReviews[invt.id].monthlyMin, undefined);
  assert.equal(seedOpportunities.filter((opportunity) => opportunity.company === '英威腾').length, 1);
  for (const company of ['中国通服四川', '天池能源']) {
    assert.equal(seedOpportunities.some((opportunity) => opportunity.company.includes(company)), false, company);
  }
});

test('October 19 update adds distinct undergraduate roles and removes expired unstarted cards only', () => {
  const ids = [
    'irootech-energy-ba-2027',
    'shixi-data-security-product-2027',
    'greatwall-power-data-2027',
    'chaitin-ai-security-product-2027',
  ];
  const companies = new Set();
  for (const id of ids) {
    const item = seedOpportunities.find((opportunity) => opportunity.id === id);
    assert.ok(item && screeningReviews[id].eligible, id);
    assert.equal(item.verifiedAt, '2026-10-19');
    assert.match(item.degreeGate, /本科/);
    assert.ok(new URL(item.applyUrl));
    assert.ok(new URL(item.sourceUrl));
    assert.equal(companies.has(normalizeCompanyName(item.company)), false, item.company);
    companies.add(normalizeCompanyName(item.company));
    assert.equal(seedOpportunities.filter((seed) => normalizeCompanyName(seed.company) === normalizeCompanyName(item.company)).length, 1);
  }
  assert.equal(screeningReviews['irootech-energy-ba-2027'].monthlyMin, 15000);
  assert.equal(screeningReviews['shixi-data-security-product-2027'].monthlyMin, 12500);
  assert.equal(screeningReviews['chaitin-ai-security-product-2027'].monthlyMin, 20000);
  assert.equal(screeningReviews['greatwall-power-data-2027'].salaryKind, '未公开');

  const expired = initial().find((item) => item.id === 'cnpc-zhejiang-digital-2027');
  assert.ok(expired);
  assert.equal(isOpportunityInScope(expired, retiredSeedIds, '2026-10-15'), true);
  assert.equal(isOpportunityInScope(expired, retiredSeedIds, '2026-10-19'), false);
  expired.stage = '准备中';
  assert.equal(isOpportunityInScope(expired, retiredSeedIds, '2026-10-19'), true);
  assert.equal(isOpportunityInScope({ ...expired, stage: '已投递' }, retiredSeedIds, '2026-10-19'), true);
});

test('city screening hides only unstarted out-of-scope locations and preserves progress', () => {
  const stored = initial();
  for (const id of Object.keys(locationExclusions)) {
    const item = stored.find((opportunity) => opportunity.id === id);
    assert.ok(item, id);
    assert.equal(item.stage, '待投递');
    assert.equal(isOpportunityInScope(item, retiredSeedIds), false, id);
    item.stage = '准备中';
    item.notes = '用户已有准备进度';
    assert.equal(isOpportunityInScope(item, retiredSeedIds), true, id);
  }
  assert.equal(Object.keys(locationExclusions).length, 10);
  const dalian = stored.find((opportunity) => opportunity.id === 'bankcomm-fintech-2027');
  assert.ok(dalian);
  assert.equal(screeningReviews[dalian.id].eligible, false);
  assert.equal(isOpportunityInScope({ ...dalian, stage: '待投递' }, retiredSeedIds), false);
  assert.equal(isOpportunityInScope({ ...dalian, stage: '已投递' }, retiredSeedIds), true);
  assert.match(getPreferredCityNote('北京 / 上海 / 西安 / 深圳'), /上海.*深圳.*北京\/西安不投/);
  assert.match(getPreferredCityNote('北京 / 河北 / 江苏'), /确认.*城市/);
  assert.equal(getPreferredCityNote('上海 / 深圳'), null);
});

test('same-employer alias keeps one Fanruan card unless the user progressed another role', () => {
  assert.equal(normalizeCompanyName('帆软软件'), normalizeCompanyName('帆软'));
  const fresh = initial();
  assert.deepEqual(fresh.filter((item) => normalizeCompanyName(item.company) === '帆软').map((item) => item.id), [
    'fanruan-product-2027',
  ]);
  const oldFde = seedOpportunities.find((item) => item.id === 'fanruan-fde-ai-solution-2027');
  const previous = [{
    ...oldFde,
    compensation: oldFde.compensation || '未公开',
    stage: '准备中', appliedAt: null, nextActionAt: null, notes: '正在准备FDE',
    favorite: true, archived: false, isCustom: false,
  }];
  const reloaded = mergeOpportunities(seedOpportunities, previous, now);
  const fanruan = reloaded.filter((item) => normalizeCompanyName(item.company) === '帆软');
  assert.deepEqual(fanruan.map((item) => item.id), ['fanruan-fde-ai-solution-2027']);
  assert.equal(fanruan[0].notes, '正在准备FDE');
});

test('company-level dedup keeps existing user progress and suppresses a new seed card', () => {
  assert.equal(normalizeCompanyName('恒生电子股份有限公司'), normalizeCompanyName('恒生电子'));
  const stored = initial().filter((item) => item.id !== 'hundsun-requirements-ai-2027');
  const custom = {
    ...stored[0],
    id: 'manual-hundsun-interview',
    company: '恒生电子股份有限公司',
    role: '产品经理',
    stage: '面试',
    isCustom: true,
    notes: '已经进入面试',
  };
  const reloaded = mergeOpportunities(seedOpportunities, [...stored, custom], now);
  assert.equal(reloaded.some((item) => item.id === 'hundsun-requirements-ai-2027'), false);
  assert.equal(reloaded.filter((item) => normalizeCompanyName(item.company) === normalizeCompanyName('恒生电子')).length, 1);
  assert.equal(reloaded.find((item) => item.id === custom.id).stage, '面试');

  const withoutPylontech = initial().filter((item) => item.id !== 'pylontech-cloud-product-2027');
  const olderWaitingRecord = {
    ...withoutPylontech[0],
    id: 'older-pylontech-record',
    company: '派能科技股份有限公司',
    role: '已有岗位',
    stage: '待投递',
    isCustom: false,
  };
  const waitingReloaded = mergeOpportunities(seedOpportunities, [...withoutPylontech, olderWaitingRecord], now);
  assert.equal(waitingReloaded.some((item) => item.id === 'pylontech-cloud-product-2027'), false);
  assert.equal(waitingReloaded.filter((item) => normalizeCompanyName(item.company) === normalizeCompanyName('派能科技')).length, 1);
});
