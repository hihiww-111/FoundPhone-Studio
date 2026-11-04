# 左航自由留言的私有收集

范围：仅 `phone-a-story` 中发给 A左左、经过运行时验证并点击发送的自由文字。草稿、自动剧情输入、其他会话和创作预览不上传。不会新增剧情弹窗、后台入口或公开读取接口。不能保证离线、关闭页面、拦截请求等情况下全部送达；发送失败不阻断剧情。

存储：Cloudflare D1 `left_messages` 表，保存随机消息 ID、匿名访问 ID、正文及服务器接收时间，不保存 IP、浏览器指纹或账号。最多 4000 字符，每匿名访问 24 小时最多 100 条；消息 ID 唯一，重试不会重复写入。匿名 ID 仅用于分组、防止同一访问大量提交，不能据此识别真人。该限制并不替代 Cloudflare 的滥用防护。

查看：只通过拥有该数据库访问权限的 Cloudflare 账户登录控制台 → Workers & Pages → D1 → 数据库 → Console。执行：

```sql
SELECT received_at AS 接收时间, message AS 留言, session_id AS 匿名访问
FROM left_messages ORDER BY received_at DESC LIMIT 200;
```

网站 `/api/left-messages` 只有写入功能。GET、HEAD 等请求返回 405，响应从不包含留言。数据库凭据不进入网页代码或 GitHub。请保持 Cloudflare 账户仅本人可用；拥有该账户/D1 权限的其他成员也能查看。留言不写入应用日志，不会自动清理。

## 启用步骤

1. 登录自己的 Cloudflare 账户：`npx wrangler@4.156.0 login`。
2. 创建 D1：`npx wrangler@4.156.0 d1 create zj-phone-left-messages`。
3. 将返回的真实 database_id 加入 `wrangler.toml`（不能填示例值）：

```toml
[vars]
COLLECTION_ENABLED = "true"

[[d1_databases]]
binding = "LEFT_MESSAGES"
database_name = "zj-phone-left-messages"
database_id = "创建后返回的真实 ID"

[env.preview.vars]
COLLECTION_ENABLED = "false"
```

4. 初始化：`npx wrangler@4.156.0 d1 execute zj-phone-left-messages --remote --file migrations/0001_left_messages.sql`。
5. 发布当前分支的 Pages；确认生产环境有绑定，预览环境不绑定生产数据库。
6. 用虚构文字实测一次发送，控制台确认收到一行，再确认 GET 接口无法读取。调试时不导出或提交真实访客留言。

没有 D1 绑定或没有 COLLECTION_ENABLED=true 时接口返回 503，不收集。2026-11-04 已在本人 Cloudflare 账户创建 `zj-phone-left-messages`，生产绑定和启用开关见 `wrangler.toml`，预览环境禁用。数据库 ID 是资源标识，不是凭据；OAuth 凭据仅保存在 Git 仓库外。

接口同时检查生产域名 `zj-phone.pages.dev`，预览域名无法写入；更换正式域名时需同步修改白名单。

配置依据：[Cloudflare Pages D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases)。

生产验证：写入虚构测试留言返回204，同一ID重发仍只有一行；GET返回405，异源POST返回403。验证后仅删除指定测试ID，未导出真实访客数据。134项单元测试、构建及Functions编译通过。查看者仍需登录具有该数据库权限的Cloudflare账户。
