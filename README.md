# 胡佳仪 · 2027 秋招投递台

面向 B 端产品、能源电力、AI+能源和知识图谱方向的秋招机会与投递进度看板。

## 接手修改

- 核心交互页面：`app/dashboard.tsx`
- 默认企业与岗位数据：`lib/opportunities.ts`
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
