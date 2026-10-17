# Deployment Guide

本文档描述把当前仓库发布到生产环境的步骤。目标架构为 Cloudflare Pages + Pages Functions，Strapi 与 PostgreSQL 已部署在 Railway。

## 1. 当前状态

仓库已具备以下条件：

- `astro.config.mjs` 已使用 `output: "static"`，`site` 指向 `https://cncmachining.pages.dev`。
- `@astrojs/node` 已移除，`wrangler` 已加入 devDependencies 用于本地验证 Pages Functions。
- 询盘接口已实现为 Cloudflare Pages Function：`functions/api/inquiry.ts`。
- Strapi 5 与 PostgreSQL 已在 Railway 运行：`https://strapi-production-513a.up.railway.app`。

剩余工作集中在 Cloudflare Pages 项目配置、环境变量、Strapi 内容类型与域名绑定。

## 2. 目标架构

```text
Visitor
  |
  v
Cloudflare DNS + CDN
  |
  +-- Cloudflare Pages
  |     |-- Astro static pages
  |     `-- Functions: POST /api/inquiry
  |           |-- Resend email
  |           `-- Airtable backup (optional)
  |
  `-- Strapi on Railway (content API)
        |
        v
      PostgreSQL on Railway
```

## 3. 前置条件

- GitHub 仓库，当前项目已推送到 `main` 分支。
- Cloudflare 账号。
- 正式域名，域名 DNS 已托管到 Cloudflare。
- Resend 账号及已验证发信域名。
- Railway 上的 Strapi 与 PostgreSQL（已完成）。
- 可选 Airtable，用于询盘备份。
- 可选 Cloudflare Turnstile site key 与 secret key，用于表单反垃圾。

## 4. 前端与 Pages Function

### 4.1 Astro 配置

当前配置已满足静态构建要求，无需修改：

```js
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "static",
  integrations: [tailwind()],
  site: "https://cncmachining.pages.dev",
});
```

绑定正式域名后，把 `site` 改为正式域名并重新部署。

### 4.2 询盘 Function

`functions/api/inquiry.ts` 已实现以下行为：

- 复用 `src/lib/validation.ts` 的 `inquirySchema` 做服务端校验，失败返回 `400 validation_failed` 并附带 `fieldErrors`。
- 请求体超过 100 KB 返回 `413 payload_too_large`。
- honeypot 字段 `website` 由 schema 限制为空字符串，机器人提交直接被校验拦截。
- 配置 `TURNSTILE_SECRET_KEY` 后校验 Turnstile token，未配置则跳过。
- 通过 Resend API 发送询盘邮件到 `INQUIRY_TO_EMAIL`，`reply_to` 为提交人邮箱。
- 配置 `AIRTABLE_API_KEY` 与 `AIRTABLE_BASE_ID` 后写入 Airtable 备份；备份失败不影响已发出的邮件，只记录错误日志。
- 未配置 Resend 密钥时（本地或预览环境）直接受理请求，便于自动化测试。
- 成功响应：`{ status: "accepted", id, receivedAt }`。
- 错误日志包含 `requestId`、错误分类和耗时，不包含密钥、完整 Email 内容或附件内容。

接口契约见 `contracts/inquiry-api.openapi.yaml`，响应码包括 `200`、`400`、`413`、`429`、`500`。其中 `429 rate_limited` 由 Cloudflare 侧限流规则返回，见第 6.3 节。

### 4.3 本地验证 Pages 与 Function

```bash
npm run build
npx wrangler pages dev dist --binding RESEND_API_KEY=replace-me --binding INQUIRY_TO_EMAIL=inquiry@example.com
```

然后验证：

- `http://127.0.0.1:8788/` 页面可访问。
- `POST http://127.0.0.1:8788/api/inquiry` 合法请求返回 `accepted`，非法请求返回 `400`。

也可以对 wrangler 实例运行完整检查：

```bash
BASE_URL=http://127.0.0.1:8788 node scripts/local-test.mjs
```

## 5. Strapi 配置（Railway）

Strapi 与 PostgreSQL 已在 Railway 部署完成，实例地址：

```text
https://strapi-production-513a.up.railway.app
```

### 5.1 创建内容类型

登录 `https://strapi-production-513a.up.railway.app/admin`，按 `contracts/cms-content-model.json` 和 `docs/cms-content-model.md` 创建：

- Product Line
- Equipment
- Certification
- Case Study
- Company Info
- Page

### 5.2 生成 API Token

在 Strapi Admin 中：

1. 进入 Settings。
2. 进入 API Tokens。
3. 创建只读 Token。
4. 复制 Token，仅作为 Cloudflare Pages 的构建环境变量使用，不暴露到浏览器。

### 5.3 配置 CORS

在 Railway 的 Strapi 服务环境变量中设置：

```dotenv
CORS_ORIGIN=https://cncmachining.pages.dev,https://www.lancoprecision.com
```

绑定正式域名后必须包含正式域名，URL 不带尾部斜杠。

## 6. 环境变量

### 6.1 Cloudflare Pages

在 Cloudflare Pages 项目的 Settings -> Environment variables 中添加：

| 变量                  | 类型       | 说明                                                    |
| --------------------- | ---------- | ------------------------------------------------------- |
| `PUBLIC_STRAPI_URL`   | Production | `https://strapi-production-513a.up.railway.app`         |
| `STRAPI_API_TOKEN`    | Secret     | Strapi 只读 Token，仅构建期使用                         |
| `RESEND_API_KEY`      | Secret     | Resend API Key                                          |
| `INQUIRY_TO_EMAIL`    | Secret     | 询盘接收邮箱                                            |
| `INQUIRY_FROM_EMAIL`  | Production | 可选，Resend 发信地址，需使用已验证域名                 |
| `TURNSTILE_SECRET_KEY`| Secret     | 可选，Turnstile 服务端校验密钥                          |
| `AIRTABLE_API_KEY`    | Secret     | 可选，Airtable Key                                      |
| `AIRTABLE_BASE_ID`    | Secret     | 可选，Airtable Base                                     |
| `AIRTABLE_TABLE_NAME` | Secret     | 可选，Airtable 表名，默认 `Inquiries`                   |

### 6.2 Railway（Strapi）

Railway 上数据库与 Strapi 密钥已配置。上线前确认：

- `DATABASE_*` 指向 Railway PostgreSQL。
- `JWT_SECRET`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET`、`APP_KEYS` 为强随机值。
- `CORS_ORIGIN` 包含 Pages 域名与正式域名。

### 6.3 限流与反垃圾

契约中的 `429 rate_limited` 不由 Function 自身返回，建议在 Cloudflare 配置：

1. 在 Security -> WAF -> Rate limiting rules 中为 `/api/inquiry` 添加规则，例如每个 IP 每分钟 5 次请求，超限返回 429。
2. 可选启用 Turnstile：在前端表单挂载 Turnstile widget，把 token 放入 `turnstileToken` 字段；在 Pages 环境变量中配置 `TURNSTILE_SECRET_KEY` 后 Function 自动启用服务端校验。

## 7. Cloudflare Pages 项目配置

在 Cloudflare Dashboard 创建 Pages 项目并连接 GitHub：

| 配置项                 | 值                  |
| ---------------------- | ------------------- |
| Production branch      | `main`              |
| Build command          | `npm run build`     |
| Build output directory | `dist`              |
| Node.js version        | `22.x` 或与本地一致 |
| Functions directory    | `functions`         |

部署成功后，Cloudflare 会分配 `*.pages.dev` 域名。

## 8. 域名与 HTTPS

1. 将正式域名 DNS 托管到 Cloudflare。
2. 在 Pages 项目中选择 Custom domains。
3. 添加 `www.lancoprecision.com`。
4. 配置根域名重定向到 `www`，或直接添加根域名。
5. 开启 Full 或 Full (strict) SSL。
6. 等待证书签发，确认 `https://www.lancoprecision.com` 可访问。
7. 把 `astro.config.mjs` 的 `site` 改为正式域名，并更新 Strapi 的 `CORS_ORIGIN`。

## 9. 发布前检查清单

- [ ] `npm run check` 通过。
- [ ] `npm run build` 通过。
- [ ] `BASE_URL=http://127.0.0.1:8788 node scripts/local-test.mjs`（wrangler pages dev）通过。
- [ ] Pages Function 的合法请求返回 `accepted`。
- [ ] Pages Function 的非法请求返回 `400` 与 `validation_failed`。
- [ ] 正式环境询盘能收到邮件并写入备份。
- [ ] 所有图片、PDF、字体和静态资源通过 CDN 加载。
- [ ] 移动端 390px 和桌面端 1440px 无横向滚动。
- [ ] 页脚地址、电话、隐私政策完整显示。
- [ ] `sitemap.xml`、`robots.txt`、canonical 和 Open Graph 正常。
- [ ] Strapi `CORS_ORIGIN` 包含正式域名。
- [ ] 环境变量中不包含真实密钥提交记录。

## 10. 回滚

Cloudflare Pages：

1. 在 Pages 项目的 Deployments 中选择上一次成功部署。
2. 点击 Rollback to this deployment。

Strapi（Railway）：

1. 在 Railway 的 Strapi 服务 Deployments 中选择上一个可用部署并重新部署。
2. 回滚数据库变更前先在 Railway 备份 PostgreSQL 数据。

## 11. 监控与告警

建议监控：

- Cloudflare Pages 部署状态和构建失败率。
- 询盘 Function 的 4xx、5xx 和超时（日志中的 `inquiry_processing_failed` 与 `inquiry_backup_failed`）。
- Resend 邮件投递失败率。
- Airtable 备份失败率。
- 页面 Core Web Vitals。

建议告警：

- 生产构建失败。
- 询盘 Function 5xx 率超过 2%。
- 邮件或备份连续失败。
- 正式域名证书异常或不可访问。

## 12. 常见问题

### Pages Function 返回 404

确认 Function 位于仓库根目录的 `functions/api/inquiry.ts`，且 Cloudflare Pages 的 Functions directory 为 `functions`。

### 构建成功但图片不显示

确认图片位于 `public/images/`，页面引用路径以 `/images/` 开头，并且 Cloudflare Pages 的 build output directory 为 `dist`。

### Strapi 请求跨域失败

确认 Railway 上 Strapi 的 `CORS_ORIGIN` 已包含 Pages 域名与正式域名，且 URL 没有尾部多余斜杠。

### 询盘没有收到邮件

检查 Resend 域名验证、`INQUIRY_TO_EMAIL`、`RESEND_API_KEY` 和 Cloudflare 环境变量是否匹配；在 Pages Function 日志中查找 `inquiry_processing_failed`。

### 本地 wrangler 验证时询盘返回 500

确认启动命令已通过 `--binding` 提供 `RESEND_API_KEY` 与 `INQUIRY_TO_EMAIL`。占位值 `replace-me` 会被视为未配置，Function 将直接受理请求而不发信。
