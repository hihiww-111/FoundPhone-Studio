# Cloudflare Pages 部署

生产分支：`feat/phone-a-phase1`。应用构建命令：`npm run build`，输出目录：`dist`，Node.js 版本：22。

## 首次迁移

在 Cloudflare 的 Workers & Pages 中创建 **Pages** 项目，连接 `hihiww-111/FoundPhone-Studio`，生产分支选 `feat/phone-a-phase1`，构建命令填 `npm run build`，输出目录填 `dist`，根目录留空。项目名优先使用 `zj-phone`，实际公开地址以部署结果为准。

不要将现有 `.github/workflows/pages.yml` 误认为 Cloudflare 自动部署；该文件用于 GitHub Pages，且仅监听 `main`。Cloudflare Git 集成配置成功后会独立构建当前生产分支。

也可在已登录的 Wrangler 环境中部署构建产物：

```sh
npx wrangler@4.156.0 pages project create zj-phone --production-branch feat/phone-a-phase1
npm run deploy:pages
```

仅首次创建项目时运行 `project create`。Direct Upload 项目和 Git 集成项目的创建方式不同；如果需要 Cloudflare 自动跟随 GitHub 更新，优先使用控制台 Git 集成。

## 原 Worker

迁移不删除原 Worker。旧配置保存在 `wrangler.worker.toml`；需要维护原 Worker 时显式使用 `npx wrangler@4.156.0 deploy --config wrangler.worker.toml`。默认 `wrangler.toml` 现在用于 Pages。

## 验收

检查新网址的页面、`work.json`、图片及音视频；测试 `060522` 解锁、App 导航、书签、音乐后台播放和 Instagram。新域名与旧域名的浏览器存档及 PWA 缓存相互独立，不会自动迁移。只有实际部署成功后才将新网址提供给访问者。
