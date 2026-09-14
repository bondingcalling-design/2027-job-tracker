export type ScreeningReview = {
  eligible: boolean;
  reason: string;
  salaryKind?: '本届公开' | '招聘转载参考' | '往届参考' | '未公开';
  monthlyMin?: number;
  salarySourceUrl?: string;
  salarySourceLabel?: string;
};

// 2026-09-14：按具体岗位审核；“大厂”仅指互联网超大厂，产业科技企业不因规模自动排除。
const exclusions: [string, string[]][] = [
  ['互联网超大厂不再新增推荐；已有准备或投递进度继续保留', [
    'baidu-ai-pm-2027', 'alibaba-cloud-product-2027', 'alibaba-group-product-2027',
    'pdd-campus-2027',
  ]],
  ['规模不作为排除理由，但这些旧集团入口或泛岗位尚未通过本科具体产品岗与薪资证据复核', [
    'dji-digital-2027', 'oppo-ai-pm-2027', 'oppo-internet-pm-2027',
    'xiaomi-product-2027', 'dji-campus-2027', 'anker-campus-2027',
    'lenovo-product-2027', 'xiaopeng-ai-product-2027', 'li-auto-product-2027',
    'chinatelecom-campus-2027', 'catl-campus-2027',
    'ke-product-2027', 'nio-energy-product-2027', 'yonyou-b2b-product-2027',
    'byd-energy-digital-2027', 'inovance-b2b-market-2027',
    'chnenergy-xinjiang-digital-2027', 'sany-digital-energy-2027',
    'star-net-product-2027', 'inspur-datacenter-product-2027',
  ]],
  ['偏项目管理、实施交付、工程服务或非产品工作，不再主动推荐', [
    'metax-product-2027', 'hand-ai-consultant-2027', 'transwarp-ai-delivery-2027',
    'ampace-aidc-solution-2027', 'teld-solution-2027', 'foxess-solution-2027',
    'sac-power-ai-service-2027', 'wisdri-automation-technical-marketing-2027',
    'cetc-digital-project-client-2027', 'dongfang-electric-solution-2027',
    'cmcc-qinghai-solution-2027', 'neusoft-consulting-2027',
  ]],
  ['私企公开月薪下限不足1万元；不以区间上限判断符合要求', [
    'sifang-power-solution-2027', 'luoshu-ai-energy-2027',
  ]],
  ['尚缺同城市应届产品岗的可靠月薪参考，暂不计入高薪推荐', [
    'spirit-ai-product-2027', 'duxiaoman-ai-pm-2027', 'insta360-ai-pm-2027',
    'sigenergy-sales-service-2027', 'hoymiles-product-engineer-2027',
  ]],
  ['未核实到计算机本科匹配的具体产品岗，不用专业大类或集团入口代替岗位', [
    'nrec-support-2027', 'voyah-product-digital-2027',
    'wisdom-power-solution-marketing-2027', 'fiberhome-solution-product-2027',
    'hei-digital-energy-2027', 'huadian-zhejiang-digital-2027',
  ]],
  ['售前岗位专业偏电气；软件产品岗公开渠道已下线，暂不新增推荐', [
    'ecoflow-presales-2027',
  ]],
];

export const screeningReviews: Record<string, ScreeningReview> = {
  ...Object.fromEntries(exclusions.flatMap(([reason, ids]) =>
    ids.map((id) => [id, { eligible: false, reason }]),
  )),
  'kehua-digital-energy-2027': {
    eligible: false,
    reason: '2026届同城信息产品助理参考8–13K/月，且职责偏实施运维；本届未单列薪资，暂不推荐',
    salaryKind: '往届参考', monthlyMin: 8000,
    salarySourceUrl: 'https://www.shushuqiuzhi.com/article/119681',
    salarySourceLabel: '2026届厦门信息产品助理转载（非本届报价）',
  },
  'fanruan-product-2027': {
    eligible: true, reason: '本届官方产品岗：理工本科、ToB产品实习优先，16–20.5K/月',
    salaryKind: '本届公开', monthlyMin: 16000,
    salarySourceUrl: 'https://join.fanruan.com/campus/detail?id=9869',
    salarySourceLabel: '帆软官方2027产品经理岗位',
  },
  'yangteng-product-2027': {
    eligible: true, reason: '本届简章单列技术研发序列产品经理，计算机/软件专业，13–20K/月',
    salaryKind: '本届公开', monthlyMin: 13000,
    salarySourceUrl: 'https://job.hust.edu.cn/zpinfo1/2407468.htm',
    salarySourceLabel: '华科就业网2027简章岗位薪资表',
  },
  'emdoor-product-2027': {
    eligible: true, reason: '产品经理岗位明确接受计算机本科，15–20K/月；另有CET-6要求',
    salaryKind: '本届公开', monthlyMin: 15000,
    salarySourceUrl: 'https://career.nankai.edu.cn/correcruit/content/id/116842.html',
    salarySourceLabel: '南开就业网产品经理独立岗位页',
  },
  'kedacom-pm-2027': {
    eligible: true, reason: '官网2027本科产品岗在招；官网面议，13–23K/月取自同届同岗招聘转载',
    salaryKind: '招聘转载参考', monthlyMin: 13000,
    salarySourceUrl: 'https://fs.jrzp.com/nView_E84FDF39AB5A6F35.shtml',
    salarySourceLabel: '2027产品经理同岗转载，非官网报价',
  },
  'sitech-ai-product-2027': {
    eligible: false, reason: '有2027产品生态招聘及往届成都11–17K参考，但尚未核实具体AI产品岗的本科学历条件；已有准备继续保留',
    salaryKind: '往届参考', monthlyMin: 11000,
    salarySourceUrl: 'https://m.zhipin.com/zhaopin/b3ce09c8e956c20c0nB_0tu5Ew~~/',
    salarySourceLabel: '2026届成都产品经理招聘参考（非2027承诺）',
  },
  'ronds-software-product-2027': {
    eligible: true, reason: '本届独立软件产品岗：计算机本科，14–20K/月，AI工业平台覆盖电力场景',
    salaryKind: '本届公开', monthlyMin: 14000,
    salarySourceUrl: 'https://career.scnu.edu.cn/detail/job?id=2581456&online_id=3591408',
    salarySourceLabel: '华南师大就业网2027软件产品经理岗位',
  },
  'huice-b2b-product-2027': {
    eligible: true, reason: '2027高潜产品经理，本科可投，企业ERP/WMS产品，15–25K×13薪',
    salaryKind: '本届公开', monthlyMin: 15000,
    salarySourceUrl: 'https://www.nowcoder.com/jobs/detail/459148?urlSource=sitemap',
    salarySourceLabel: '慧策招聘人员发布的2027高潜产品岗',
  },
  'intsig-data-product-2027': {
    eligible: true, reason: '27届秋招J14511：本科、SQL与大模型应用，数据产品需求与设计，13–18K/月',
    salaryKind: '本届公开', monthlyMin: 13000,
    salarySourceUrl: 'https://cn.linkedin.com/jobs/view/27届秋招-数据产品经理-j14511-at-合合信息-4460900438',
    salarySourceLabel: '合合信息岗位薪酬范围（领英/猎聘）',
  },
  'kylin-product-2027': {
    eligible: true, reason: '央企子公司独立2027产品岗，计算机本科可投；薪资不限，不包含科技项目助理岗',
    salaryKind: '未公开',
  },
  'richinfo-ai-product-2027': {
    eligible: true, reason: '本届政企AI产品岗，本科可投；RAG/Agent/知识库方向，公开月薪档下限10.5K',
    salaryKind: '本届公开', monthlyMin: 10500,
    salarySourceUrl: 'https://myjob.dlmu.edu.cn/campus/view/id/868828',
    salarySourceLabel: '高校就业网2027岗位薪资档与年薪表',
  },
  'envision-product-2027': {
    eligible: true,
    reason: '2027校招明确开放产品类和本科，能源大模型/新型电力系统高度匹配；20K+为项目公开口径，具体产品子岗需再次确认',
    salaryKind: '本届公开', monthlyMin: 20000,
    salarySourceUrl: 'https://career.nankai.edu.cn/correcruit/content/id/116772.html',
    salarySourceLabel: '南开就业网远景能源2027校招项目口径（非单一子岗报价）',
  },
  'lalamove-strategy-product-2027': {
    eligible: true,
    reason: '本届具体策略产品岗位，本科可投，16–26K/月；物流产品而非能源方向，因此推荐度靠后',
    salaryKind: '本届公开', monthlyMin: 16000,
    salarySourceUrl: 'https://m.zhipin.com/zhaopin/298301ce32a28e331nV_2tW9FQ~~/',
    salarySourceLabel: '货拉拉当前同届策略产品岗位',
  },
  'ninebot-navimow-product-2027': {
    eligible: true,
    reason: '九号旗下智能机器人子公司本届软件产品岗，计算机本科，15–30K×15薪；非项目管理或客户交付',
    salaryKind: '本届公开', monthlyMin: 15000,
    salarySourceUrl: 'https://www.nowcoder.com/jobs/detail/465296',
    salarySourceLabel: '未岚大陆招聘人员发布的2027软件产品经理岗位',
  },
  'inovance-b2b-market-2027': {
    eligible: false,
    reason: '已重新筛选：现有条目是技术市场/解决方案且专业偏电气自动化；另查到的大连产品岗薪资仅有公司应届均值参考，暂不满足具体岗位证据要求',
    salaryKind: '招聘转载参考', monthlyMin: 12900,
    salarySourceUrl: 'https://www.jobui.com/company/1261638/jobs/analysis/',
    salarySourceLabel: '汇川技术当前应届岗位平均值，非本届产品岗承诺',
  },
};

type ProgressItem = { id: string; stage: string; isCustom: boolean };
const protectedStages = new Set(['准备中', '已投递', '笔试', '面试', 'Offer', '已拒绝']);

export function isOpportunityInScope(item: ProgressItem, retiredIds: readonly string[]) {
  if (item.stage === '放弃' || retiredIds.includes(item.id)) return false;
  if (protectedStages.has(item.stage)) return true;
  const review = screeningReviews[item.id];
  return review ? review.eligible : item.isCustom;
}

export function isProtectedFromScreening(item: ProgressItem) {
  return protectedStages.has(item.stage) && screeningReviews[item.id]?.eligible === false;
}
