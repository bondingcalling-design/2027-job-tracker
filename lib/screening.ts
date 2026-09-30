export type ScreeningReview = {
  eligible: boolean;
  reason: string;
  salaryKind?: '本届公开' | '招聘转载参考' | '往届参考' | '未公开';
  monthlyMin?: number;
  salarySourceUrl?: string;
  salarySourceLabel?: string;
  exceptionReason?: string;
};

// 2026-09-14：按具体岗位审核；“大厂”仅指互联网超大厂，产业科技企业不因规模自动排除。
const exclusions: [string, string[]][] = [
  ['互联网超大厂不再新增推荐；已有准备或投递进度继续保留', [
    'baidu-ai-pm-2027', 'alibaba-cloud-product-2027', 'alibaba-group-product-2027',
    'pdd-campus-2027',
  ]],
  ['规模不作为排除理由，但这些旧集团入口或泛岗位尚未通过本科具体产品岗与薪资证据复核', [
    'dji-digital-2027', 'oppo-internet-pm-2027',
    'dji-campus-2027',
    'lenovo-product-2027', 'xiaopeng-ai-product-2027', 'li-auto-product-2027',
    'chinatelecom-campus-2027', 'catl-campus-2027',
    'ke-product-2027', 'yonyou-b2b-product-2027',
    'byd-energy-digital-2027',
    'chnenergy-xinjiang-digital-2027', 'sany-digital-energy-2027',
    'star-net-product-2027', 'inspur-datacenter-product-2027',
  ]],
  ['偏项目管理、实施交付、工程服务或非产品工作，不再主动推荐', [
    'metax-product-2027', 'hand-ai-consultant-2027', 'transwarp-ai-delivery-2027',
    'foxess-solution-2027',
    'cetc-digital-project-client-2027', 'dongfang-electric-solution-2027',
    'neusoft-consulting-2027',
  ]],
  ['私企公开月薪下限不足1万元；不以区间上限判断符合要求', [
    'sifang-power-solution-2027', 'luoshu-ai-energy-2027',
  ]],
  ['尚缺同城市应届产品岗的可靠月薪参考，暂不计入高薪推荐', [
    'spirit-ai-product-2027', 'duxiaoman-ai-pm-2027', 'insta360-ai-pm-2027',
    'sigenergy-sales-service-2027', 'hoymiles-product-engineer-2027',
  ]],
  ['未核实到计算机本科匹配的具体产品岗，不用专业大类或集团入口代替岗位', [
    'voyah-product-digital-2027',
    'fiberhome-solution-product-2027',
    'hei-digital-energy-2027', 'huadian-zhejiang-digital-2027',
  ]],
];

export const screeningReviews: Record<string, ScreeningReview> = {
  ...Object.fromEntries(exclusions.flatMap(([reason, ids]) =>
    ids.map((id) => [id, { eligible: false, reason }]),
  )),
  'mingyuan-b2b-ai-product-2027': {
    eligible: true,
    reason: '本届B端SaaS产品经理，本科可投，AI企业管理场景，转正待遇10K以上',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://career.hebut.edu.cn/correcruit/content/id/80636.html',
    salarySourceLabel: '明源云2027校招产品经理公告',
  },
  'threatbook-ai-product-2027': {
    eligible: true,
    reason: '本届产品经理/产品运营明确本科开放；本科18万起、八险一金与期权，AI安全B端方向',
    salaryKind: '本届公开',
    salarySourceUrl: 'https://career.nankai.edu.cn/correcruit/content/id/116958.html',
    salarySourceLabel: '微步在线2027校招公告（年薪口径，非月薪承诺）',
    exceptionReason: '高薪AI安全中厂：公告要求党员或团员，投前确认政治面貌；待遇用年薪口径，不强行折算月薪',
  },
  'qiyuan-energy-product-2027': {
    eligible: true,
    reason: '新能源商用车能源服务平台，本科产品经理/产品运营开放，校招待遇10K以上',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://career.hebut.edu.cn/correcruit/content/id/79135.html',
    salarySourceLabel: '启源芯动力2027校招岗位与待遇公告',
    exceptionReason: '能源平台高度垂直：岗位池混合运营与客户服务，投递时只选产品/产品运营/能源管理',
  },
  'novastar-product-solution-2027': {
    eligible: true,
    reason: '本届产品与解决方案工程师，本科理工科可投，工作含产品规划建议、竞品分析与研发反馈',
    salaryKind: '未公开',
    salarySourceUrl: 'https://www.nowcoder.com/jobs/detail/462610',
    salarySourceLabel: '诺瓦星云2027具体岗位页（薪资面议）',
    exceptionReason: '技术产品相邻岗：薪资待核验且接受全国办事处，确认月薪和出差比例后再决定',
  },
  'sifang-power-service-2027': {
    eligible: true,
    reason: '电力装备与新能源场景，本科计算机可投调试/工程服务，调试岗位10–15K/月',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://career.cup.edu.cn/campus/view/id/460244',
    salarySourceLabel: '四方股份2027校招岗位与薪资表',
    exceptionReason: '电力垂直保底项：现场调试属性强，只有接受出差/现场时投递，不投项目管理',
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
  'autohome-b2b-product-2027': {
    eligible: true,
    reason: '本届独立B端产品岗：车商CRM/SaaS/供应链，本科可投，18–22K×16薪',
    salaryKind: '本届公开', monthlyMin: 18000,
    salarySourceUrl: 'https://www.nowcoder.com/jobs/detail/466943',
    salarySourceLabel: '企业校园招聘人员发布的2027具体岗位',
  },
  'cmic-ai-product-2027': {
    eligible: true,
    reason: '中国移动旗下官方2027 AI产品岗，本科计算机可投；知识库/智能体匹配，央企不设薪资下限',
    salaryKind: '未公开',
  },
  'nio-energy-product-2027': {
    eligible: true,
    reason: '本届充电/能源产品独立岗位，本科可投，覆盖充电管理系统与AI；薪资用往届产品岗Offer谨慎参考',
    salaryKind: '往届参考', monthlyMin: 17500,
    salarySourceUrl: 'https://www.nowcoder.com/discuss/455071324004769792',
    salarySourceLabel: '蔚来2023届产品岗Offer分享，非本届承诺',
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
    eligible: true,
    reason: '本届具体市场类岗位本科可投，工业自动化/新能源B端方案，12–20K/月',
    salaryKind: '本届公开', monthlyMin: 12000,
    salarySourceUrl: 'https://jy.scu.edu.cn/index/index/employjobdetail.html?data=MDAwMDAwMDAwMJG6n3_Ed6imi4qQtLh4Y9yK0dTOs4bddricp9CWi5qikaeWacSdqLqGfaK2w4iil5C4zNbGiL-E',
    salarySourceLabel: '高校就业网2027具体市场类岗位页',
    exceptionReason: '高薪私企工业B端：允许销售/出差属性，但明确排在纯产品与AI+能源岗位之后',
  },
  'vivo-platform-product-2027': {
    eligible: true,
    reason: '你已于9月15日投递平台方向产品经理，作为真实流程保留；后续仅按你填写的日期提醒',
    salaryKind: '未公开',
    exceptionReason: '已投递保留：不再用尚未核实的薪资或竞争强度覆盖你的实际选择',
  },
  'engergy-ai-energy-solution-2027': {
    eligible: true,
    reason: '2027校招AI+能源解决方案岗，计算机/AI/控制/能源专业开放，10–15K/月',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://job.zut.edu.cn/module/position_brief_detail/id-113985/nid-6287',
    salarySourceLabel: '中原工学院就业网2027岗位与待遇页',
    exceptionReason: 'AI+能源高度垂直且双休弹性：可接受部分方案与客户现场工作',
  },
  'fanruan-fde-ai-solution-2027': {
    eligible: true,
    reason: '官方2027 AI解决方案岗，本科计算机可投，职责含需求洞察与产品反馈闭环，13–17K/月',
    salaryKind: '本届公开', monthlyMin: 13000,
    salarySourceUrl: 'https://join.fanruan.com/campus/detail?id=9889',
    salarySourceLabel: '帆软官方FDE解决方案工程师岗位页',
    exceptionReason: '高薪私企AI方案：允许售前、POC和客户赋能，但不是项目经理',
  },
  'siemens-sales100-2027': {
    eligible: true,
    reason: '西门子官方2027本科项目，计算机/AI可投，聚焦工业数字化解决方案',
    salaryKind: '未公开',
    salarySourceUrl: 'https://www.siemens.com/zh-cn/company/jobs/campus-recruiting/',
    salarySourceLabel: '西门子官方2027校园招聘与福利说明',
    exceptionReason: '外企与工作节奏例外：官方注明混合办公、拒绝996和系统培训',
  },
  'kehua-digital-energy-2027': {
    eligible: true,
    reason: '本届产品工程师/IT产品助理/微网EMS岗位，本科开放，项目页标注10K以上',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://career.hebut.edu.cn/home/correcruit/content/id/80200.html',
    salarySourceLabel: '河北工大就业网科华2027校招与岗位表',
    exceptionReason: 'AI+数字能源垂直：岗位专业分流较细，投递时只选产品工程师、IT产品助理或微网EMS',
  },
  'ampace-aidc-solution-2027': {
    eligible: true,
    reason: 'AIDC供电、储能EMS/BMS解决方案本科开放，校招项目月薪10K起',
    salaryKind: '本届公开', monthlyMin: 10000,
    salarySourceUrl: 'https://career.hebut.edu.cn/correcruit/content/id/79145.html',
    salarySourceLabel: '高校就业网2027校招岗位与待遇页',
    exceptionReason: '高薪私企AI+能源：允许售前/交付，但优先AIDC解决方案而非纯项目管理',
  },
  'teld-solution-2027': {
    eligible: true,
    reason: '总部电气类本科岗位10.5–15K/月，数字充电网、电力交易和能源方案高度匹配',
    salaryKind: '本届公开', monthlyMin: 10500,
    salarySourceUrl: 'https://myjob.dlmu.edu.cn/campus/view/id/868552',
    salarySourceLabel: '高校就业网2027岗位与薪资表',
    exceptionReason: '高薪私企电力垂直：接受售前/方案，避开纯项目管理和强销售岗位',
  },
  'nrec-support-2027': {
    eligible: true,
    reason: '2027届本科开放技术支持与信息技术，电力系统/储能垂直，七险二金',
    salaryKind: '未公开',
    salarySourceUrl: 'https://www.wondercv.com/xiaozhao/nanrui-jibao-2027-campus-recruitment-13172-8ca5ea/',
    salarySourceLabel: '南瑞继保2027校招岗位、学历与福利汇总',
    exceptionReason: '央国企电力与高福利例外：可接受技术支持，但不选择纯现场调试',
  },
  'sac-power-ai-service-2027': {
    eligible: true,
    reason: '2027本科开放，人工智能、系统软件与储能/新能源服务均在招，六险二金',
    salaryKind: '未公开',
    salarySourceUrl: 'https://m.nj.bendibao.com/job/182644.shtm',
    salarySourceLabel: '国电南自2027校招岗位与福利汇总',
    exceptionReason: '央企电力垂直例外：优先AI/系统软件；调试服务仅作保底',
  },
  'wisdom-power-solution-marketing-2027': {
    eligible: true,
    reason: '国企数字电力/智慧能源方案岗位，本科可投，客户覆盖电网与工业企业',
    salaryKind: '本届公开', monthlyMin: 5000,
    salarySourceUrl: 'https://www.fenbi.com/page/exam-information-detail/468601157997568',
    salarySourceLabel: '2027具体岗位与福利页',
    exceptionReason: '国企电力垂直例外：不设私企10K门槛，但需接受驻外/出差',
  },
  'wisdri-automation-technical-marketing-2027': {
    eligible: true,
    reason: '央企工业自动化技术/营销岗位，本科开放，七险一金与单身公寓',
    salaryKind: '未公开',
    salarySourceUrl: 'https://career.hebut.edu.cn/home/correcruit/content/id/79331.html',
    salarySourceLabel: '2027校招岗位学历与福利表',
    exceptionReason: '央企B端与福利例外：技术营销可投，现场调试岗位放在后排',
  },
  'cmcc-qinghai-solution-2027': {
    eligible: true,
    reason: '央企省公司明确开放产品管理、解决方案和经营分析，本科计算机可投',
    salaryKind: '本届公开', monthlyMin: 5000,
    salarySourceUrl: 'https://career.sustech.edu.cn/detail/online?id=3595540',
    salarySourceLabel: '中国移动青海2027校招公告',
    exceptionReason: '央企产品岗位例外：薪资不设下限，仅在能接受青海长期发展时投递',
  },
  'ecoflow-presales-2027': {
    eligible: true,
    reason: '2027本科售前解决方案岗，储能场景含需求反馈与产品迭代，14–17K/月',
    salaryKind: '本届公开', monthlyMin: 14000,
    salarySourceUrl: 'https://www.nowcoder.com/jobs/detail/464341',
    salarySourceLabel: '正浩创新校招HR发布的2027具体岗位',
    exceptionReason: '高薪私企清洁能源：允许售前/客户培训，但不是纯项目交付',
  },
  'oppo-ai-pm-2027': {
    eligible: true,
    reason: '官方2027互联网产品经理（AI方向），计算机本科可投；本届未公开月薪，采用深圳经验不限AI产品岗20–40K参考并降低推荐度',
    salaryKind: '招聘转载参考', monthlyMin: 20000,
    salarySourceUrl: 'https://www.zhipin.com/zhaopin/33e51e8132a7a8381HF92NW7Ew~~/',
    salarySourceLabel: 'OPPO深圳经验不限AI产品岗参考，非本届报价',
  },
  'xiaomi-product-2027': {
    eligible: true,
    reason: '2027具体策略产品岗，计算机本科可投；薪资采用本届校招项目公开区间，因C端且竞争强放在后排',
    salaryKind: '本届公开', monthlyMin: 15000,
    salarySourceUrl: 'https://career.nankai.edu.cn/correcruit/content/id/116728.html',
    salarySourceLabel: '小米集团2027校招项目公开区间（非单一子岗报价）',
  },
  'anker-campus-2027': {
    eligible: true,
    reason: '企业招聘人员发布的2027硬件产品经理，本科理工科；本届面议，采用深圳经验不限同岗18–30K参考',
    salaryKind: '招聘转载参考', monthlyMin: 18000,
    salarySourceUrl: 'https://www.zhipin.com/zhaopin/a1b60e9324c386830XF93tq9/',
    salarySourceLabel: '安克深圳经验不限产品经理同岗参考，非本届报价',
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
