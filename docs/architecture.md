# Architecture

本文档描述 Lancoprecision 官网的系统边界、数据流、目录建议和运行依赖。需求基线见 `../需求文档.md`。

## 1. 系统上下文

```text
Visitor
  |
  v
Cloudflare Edge
  |-- Astro static pages
  `-- Pages Functions: POST /api/inquiry
        |-- Resend email
        `-- Airtable or Google Sheets backup

Content editor
  |
  v
Strapi Admin
  |
  v
Strapi content API
  |
  v
Astro build-time data fetch
  |
  v
PostgreSQL
```

## 2. 组件职责

| 组件 | 职责 |
| --- | --- |
| Astro | 静态页面构建、路由、SEO、客户端交互、内容渲染 |
| Tailwind CSS | 响应式样式、设计令牌和组件样式 |
| Strapi 5 | 内容建模、编辑、发布、媒体管理、i18n |
| PostgreSQL | 持久化 CMS 内容 |
| Cloudflare Pages | 静态托管、边缘函数、HTTPS 和 CDN |
| Pages Function | 询盘校验、邮件发送、备份和响应 |
| Resend | 询盘邮件投递 |
| Airtable 或 Google Sheets | 询盘备份，便于运营查看 |

## 3. 数据流

### 3.1 内容发布

1. 运营人员在 Strapi 后台新增或修改内容。
2. Strapi 保存到 PostgreSQL。
3. Astro 在构建时通过 Strapi content API 拉取已发布内容。
4. Cloudflare Pages 构建并部署静态产物。

### 3.2 询盘提交

1. 用户填写询盘表单。
2. 浏览器将表单数据提交到 `POST /api/inquiry`。
3. Function 校验字段、附件和请求频率。
4. Function 调用 Resend 发送邮件。
5. Function 写入备份存储。
6. Function 返回统一 JSON 响应。

## 4. 环境变量

环境变量不得提交到仓库，只允许 `.env.example` 占位。

| 变量 | 用途 |
| --- | --- |
| `PUBLIC_STRAPI_URL` | 浏览器或构建阶段读取的 Strapi API 地址 |
| `STRAPI_API_TOKEN` | 服务端拉取内容的令牌 |
| `RESEND_API_KEY` | 发送询盘邮件 |
| `INQUIRY_TO_EMAIL` | 询盘接收邮箱 |
| `AIRTABLE_API_KEY` | 可选，询盘备份 |
| `AIRTABLE_BASE_ID` | 可选，询盘备份表 |

## 5. 目录建议

```text
src/
├── assets/
├── components/
│   ├── layout/
│   ├── ui/
│   ├── content/
│   └── forms/
├── content/
├── layouts/
├── lib/
│   ├── cms/
│   └── validation/
├── pages/
│   ├── index.astro
│   ├── [lang]/
│   ├── products/[slug].astro
│   ├── about.astro
│   └── contact.astro
└── styles/
functions/
└── api/
    └── inquiry.ts
```

## 6. 内容读取策略

- 构建阶段拉取 Strapi 数据，生成静态页面。
- 产品线列表、详情、设备、认证和公司信息使用结构化 API 读取。
- 构建失败时保留上一版可访问产物，并让 Cloudflare 部署保持可回滚。

## 7. 表单安全

- 服务端是唯一可信校验层。
- 姓名、Email、公司、需求描述为必填。
- Email 使用标准校验，禁止控制字符。
- 附件使用扩展名与 MIME 白名单。
- 单次请求限制总大小。
- 使用 honeypot、时间窗口或 Turnstile 降低垃圾提交。

## 8. 性能策略

- Astro 默认静态输出。
- 图片使用响应式尺寸和现代格式。
- 非关键脚本延迟加载。
- 表单交互使用局部 hydration。
- 页面字体做子集化和预加载控制。

## 9. 可观测性

追踪以下事件：

- `inquiry_submit_started`
- `inquiry_submit_succeeded`
- `inquiry_submit_failed`
- `contact_email_click`
- `contact_phone_click`
- `contact_whatsapp_click`
- `contact_linkedin_click`
- `product_view`

错误日志包含请求 ID、错误分类和耗时，不包含密钥、完整 Email 内容或附件内容。
