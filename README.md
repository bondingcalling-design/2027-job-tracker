#   2027 秋招投递台

面向 B 端产品、能源电力、AI+能源和知识图谱方向的秋招机会与投递进度看板。

## 接手修改

- 核心交互页面：`app/dashboard.tsx`
- 默认企业与岗位数据：`lib/opportunities.ts`
- 筛选审核与薪资证据：`lib/screening.ts`
- 本地进度合并与去重：`lib/opportunity-state.ts`
- 全局样式：`app/globals.css`
- GitHub Pages 本地保存适配：`github-pages/src/main.tsx`
- GitHub Pages 页面元信息：`github-pages/index.html`
- 自动发布流程：`.github/workflows/pages.yml`

## 本地运行

```bash
pnpm install
pnpm dev
```

静态版构建：

```bash
pnpm build:pages
```

构建结果位于 `pages-dist/`。推送到 `main` 分支后，GitHub Actions 会自动更新 GitHub Pages。

## 数据保存说明

GitHub Pages 版本使用浏览器本地存储保存投递阶段、收藏、备注和日期。换电脑或清理浏览器数据前，请先在网页中导出 JSON，之后可通过“导入 JSON”恢复。

## 2026-09-14 筛选规则

- 新增及尚未准备的默认推荐：本科可投、B端/AI/能源产品；不再新增大厂和偏项目管理、实施交付的岗位。
- 私企月薪区间下限至少1万元；允许同届同岗招聘转载或往届同城同类校招参考，必须标出来源和不确定性。不能拿资深社招工资、公司全部岗位区间或年包除以12冒充基本月薪。央国企不设薪资下限。
- 已经标为“准备中”及有后续投递进度的旧条目继续显示；“放弃”仍隐藏。筛选不会删除保存的进度、备注或导出备份。
- 本轮增加容知日新、慧策、合合信息、麒麟软件、彩讯科技5家；默认9条精选，其余旧记录按进度保留。公开本科条件不代表保证通过简历筛选。
- 每个新增种子都需在 `screeningReviews` 中完成审核，否则不会进入默认推荐。学历/岗位不符的旧下架记录仍不展示。
- 薪资参考来源可在电脑展开详情或手机待遇区查看。思特奇补充往届成都参考，但具体AI岗学历未核实，因此只保留已有准备/投递；科达为同届同岗转载，不是官网承诺。

数据与进度回归检查：

```bash
node --experimental-strip-types --test tests/job-tracker.test.mjs
```
