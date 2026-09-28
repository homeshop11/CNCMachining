# Deployment Guide

本文档描述从当前本地开发状态发布到生产环境的步骤。目标环境沿用需求文档中的 Cloudflare Pages + Strapi + PostgreSQL 方案。

## 1. 当前状态

当前仓库已经可以本地运行：

- Astro 页面、产品页、About、Contact、Privacy、404。
- 询盘表单和本地 `POST /api/inquiry` 端点。
- 桌面端与移动端自动化检查。
- 当前 `astro.config.mjs` 使用 `@astrojs/node`，仅用于本地开发与本地预览。

生产部署前需要把前端切换为 Cloudflare Pages 静态构建，并把询盘端点迁移为 Cloudflare Pages Function。

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
  |           `-- Airtable or Google Sheets backup
  |
  `-- Strapi content API
        |
        v
      PostgreSQL
```

## 3. 前置条件

准备以下账号和资源：

- GitHub 仓库，并推送当前项目到 `main` 分支。
- Cloudflare 账号。
- 正式域名，域名 DNS 已托管到 Cloudflare。
- Resend 账号及已验证发信域名。
- 可选 Airtable 或 Google Sheets，用于询盘备份。
- Railway、Render 或其他 Node.js 托管账号。
- Neon 或 Supabase 的 PostgreSQL 实例。

## 4. 前端切换到 Cloudflare Pages

### 4.1 修改 Astro 配置

将 `astro.config.mjs` 改为静态输出：

```js
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "static",
  integrations: [tailwind()],
  site: "https://www.lancoprecision.com",
});
```

如果暂时使用默认域名，`site` 可替换为 Cloudflare Pages 分配的项目域名。

### 4.2 移除本地 Node Adapter

```bash
npm uninstall @astrojs/node
npm install -D wrangler
```

`wrangler` 用于本地验证 Pages Functions，不要求替换生产运行时。

### 4.3 迁移询盘接口

当前本地端点位于 `src/pages/api/inquiry.ts`，静态构建不会包含该端点。生产部署时创建：

```text
functions/api/inquiry.ts
```

保留当前 `src/lib/validation.ts` 的校验逻辑，并增加邮件发送和备份。最小示例：

```ts
import { inquirySchema } from "../../src/lib/validation";

type Env = {
  RESEND_API_KEY: string;
  INQUIRY_TO_EMAIL: string;
  AIRTABLE_API_KEY?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_TABLE_NAME?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const raw = await request.json();
    const result = inquirySchema.safeParse(raw);

    if (!result.success) {
      return json(
        {
          status: "error",
          code: "validation_failed",
          message: "Please correct the highlighted fields and try again.",
        },
        400,
      );
    }

    const inquiry = result.data;

    if (inquiry.website) {
      return json(
        {
          status: "error",
          code: "validation_failed",
          message: "The submission could not be processed.",
        },
        400,
      );
    }

    await sendEmail(inquiry, env);
    await saveBackup(inquiry, env);

    return json({
      status: "accepted",
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("inquiry_processing_failed", error);
    return json(
      {
        status: "error",
        code: "processing_failed",
        message: "The inquiry could not be processed. Please try again.",
      },
      500,
    );
  }
};
```

实际实现中应补齐 `sendEmail` 和 `saveBackup`：

- 使用 Resend API 发送到 `env.INQUIRY_TO_EMAIL`。
- 使用 Airtable API 或 Google Sheets API 写入备份。
- 日志不得包含完整附件内容或客户敏感信息。

### 4.4 本地验证 Pages

```bash
npm run build
npx wrangler pages dev dist --binding RESEND_API_KEY=replace-me --binding INQUIRY_TO_EMAIL=inquiry@example.com
```

然后验证：

- `http://127.0.0.1:8788/` 页面可访问。
- `POST http://127.0.0.1:8788/api/inquiry` 返回预期结果。

## 5. 部署 Strapi

### 5.1 创建 Strapi 应用

推荐单独仓库或子目录管理 Strapi：

```bash
npx create-strapi-app@latest cms --quickstart
```

生产环境不要使用 SQLite，改为 PostgreSQL。

### 5.2 配置 PostgreSQL

在 Neon 或 Supabase 创建 PostgreSQL 实例，然后在 Strapi 环境变量中设置：

```dotenv
DATABASE_CLIENT=postgres
DATABASE_HOST=your-host
DATABASE_PORT=5432
DATABASE_NAME=your-database
DATABASE_USERNAME=your-user
DATABASE_PASSWORD=your-password
DATABASE_SSL=true
```

### 5.3 创建内容类型

按 `contracts/cms-content-model.json` 和 `docs/cms-content-model.md` 创建：

- Product Line
- Equipment
- Certification
- Case Study
- Company Info
- Page

### 5.4 生成 API Token

在 Strapi Admin 中：

1. 进入 Settings。
2. 进入 API Tokens。
3. 创建只读 Token。
4. 复制 Token，只在服务端使用。

### 5.5 配置 CORS

Strapi CORS 必须允许 Cloudflare 正式域名：

```dotenv
CORS_ORIGIN=https://www.lancoprecision.com
```

## 6. 环境变量

### 6.1 Cloudflare Pages

在 Cloudflare Pages 项目的 Settings -> Environment variables 中添加：

| 变量                  | 类型       | 说明                 |
| --------------------- | ---------- | -------------------- |
| `PUBLIC_STRAPI_URL`   | Production | Strapi 内容 API 地址 |
| `RESEND_API_KEY`      | Secret     | Resend API Key       |
| `INQUIRY_TO_EMAIL`    | Secret     | 询盘接收邮箱         |
| `AIRTABLE_API_KEY`    | Secret     | 可选，Airtable Key   |
| `AIRTABLE_BASE_ID`    | Secret     | 可选，Airtable Base  |
| `AIRTABLE_TABLE_NAME` | Secret     | 可选，Airtable 表名  |

`STRAPI_API_TOKEN` 只应由构建或服务端读取，不能暴露到浏览器。

### 6.2 Strapi

在 Railway 或 Render 中设置：

- `DATABASE_*`
- `JWT_SECRET`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `APP_KEYS`
- `CORS_ORIGIN`

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

## 9. 发布前检查清单

- [ ] `npm run check` 通过。
- [ ] `npm run build` 通过。
- [ ] `node scripts/local-test.mjs` 通过。
- [ ] Pages Function 的合法请求返回 `accepted`。
- [ ] Pages Function 的非法请求返回 `400`。
- [ ] 正式环境询盘能收到邮件并写入备份。
- [ ] 所有图片、PDF、字体和静态资源通过 CDN 加载。
- [ ] 移动端 390px 和桌面端 1440px 无横向滚动。
- [ ] 页脚地址、电话、隐私政策完整显示。
- [ ] `sitemap.xml`、`robots.txt`、canonical 和 Open Graph 正常。
- [ ] 环境变量中不包含真实密钥提交记录。

## 10. 回滚

Cloudflare Pages：

1. 在 Pages 项目的 Deployments 中选择上一次成功部署。
2. 点击 Rollback to this deployment。

Strapi：

1. 在 Railway 或 Render 中选择上一个可用镜像。
2. 回滚数据库迁移前先备份当前数据。

## 11. 监控与告警

建议监控：

- Cloudflare Pages 部署状态和构建失败率。
- 询盘 Function 的 4xx、5xx 和超时。
- Resend 邮件投递失败率。
- Airtable 或 Google Sheets 备份失败率。
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

确认 Strapi 的 `CORS_ORIGIN` 已包含正式域名，并确认 URL 没有尾部多余斜杠。

### 询盘没有收到邮件

检查 Resend 域名验证、`INQUIRY_TO_EMAIL`、`RESEND_API_KEY` 和 Cloudflare 环境变量是否匹配。
