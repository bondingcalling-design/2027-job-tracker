// Employer leads are separate from opportunities: a recruiting portal does not
// establish that a specific job is open to this candidate.
export type FocusEmployer = {
  id: string;
  company: string;
  affiliation: string;
  status: string;
  summary: string;
  constraint: string;
  checkedAt: string;
  links: { label: string; url: string }[];
  relatedOpportunity?: { id: string; company: string };
};

export const focusEmployers: FocusEmployer[] = [
  {
    id: 'supply-cooperative',
    company: '中国供销合作社',
    affiliation: '总社事业单位、中央及地方社有企业分别核查',
    status: '供销系统有条件备选',
    summary: '已关联浙农股份杭州贸易业务岗：本届同岗月薪参考10.5–15K，属于浙江供销系统。',
    constraint: '计算机专业和“重点高校”口径须先确认；中央供销集团尚未核到适配的2027具体岗。5:1是总社某批招聘的面试入围比例，不能当作报录比。',
    checkedAt: '2026-11-02',
    links: [
      { label: '浙农集团官网', url: 'https://www.zjamp.com/index/recruitment/index.html' },
      { label: '浙农2027公告', url: 'https://hzau.91wllm.cn/campus/view/id/1008361' },
    ],
    relatedOpportunity: { id: 'zjamp-trade-hangzhou-2027', company: '浙农股份' },
  },
  {
    id: 'china-anneng',
    company: '中国安能',
    affiliation: '一、二、三局及科技、科工等下属单位',
    status: '已有2027招聘 · 适配岗待核',
    summary: '二、三局已发布2027招聘。继续关注综合经营类机会，尚未确认到计算机本科可报、城市和职责同时合适的具体岗。',
    constraint: '已查非研发岗位多限定其他专业，二局专业表外暂不接收；项目地须服从分配。免笔试、安家费等不能推定为集团统一政策。',
    checkedAt: '2026-11-02',
    links: [
      { label: '二局国聘入口', url: 'https://www.iguopin.com/company/jobs?id=10685310406946469' },
      { label: '三局2027官方推文', url: 'https://mp.weixin.qq.com/s/OA-KOflqajQL_YXOiuyHGw' },
      { label: '三局公告转载', url: 'https://www.gaoxiaojob.com/announcement/detail/435777.html' },
    ],
  },
  {
    id: 'china-resources-recycling',
    company: '中国资环',
    affiliation: '中国资源循环集团 · 深圳下属企业',
    status: '已关联本科可报岗',
    summary: '中资环电子循环利用（深圳）基地运营岗：深圳福田，计算机本科可报；官方月薪6–12K。',
    constraint: '非产品岗，作为央企运营备选；薪资下限不保证12万年包，更无“统一年薪30万起”的依据。无已核实硬截止。',
    checkedAt: '2026-11-02',
    links: [
      { label: '集团2027公告', url: 'https://www.crrg.com.cn/crrg/2026-10/09/article_2026100915381717503.html' },
      { label: '官方岗位表', url: 'https://campus.51job.com/crrg2027/job.html' },
    ],
    relatedOpportunity: { id: 'crrg-shenzhen-base-operations-2027', company: '中资环电子循环利用（深圳）' },
  },
  {
    id: 'china-logistics',
    company: '中国物流集团',
    affiliation: '集团、中储智运、华贸、铁物、中储等',
    status: '下属公司已查 · 适配岗待核',
    summary: '已查集团73岗和中储智运10个2027校园岗；中储智运有供应链产品、经营分析方向，但正式岗要求硕士。',
    constraint: '集团入口现有项目仍标2026，不能算作2027机会；“本科15–20万、专业不限”未核为统一政策。中国外运属于招商局，不替代此集团。',
    checkedAt: '2026-11-02',
    links: [
      { label: '集团校招入口', url: 'https://chinalogisticsgroup.hotjob.cn/SU6426c1e1bef57c1e26962897/pb/school.html' },
      { label: '中储智运招聘', url: 'https://zczy.zhiye.com/home/' },
    ],
  },
];
