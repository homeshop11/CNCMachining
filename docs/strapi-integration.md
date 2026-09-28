# Frontend to Strapi Integration

本文档说明当前 Astro 前端如何从已部署的 Strapi 5 读取内容。当前前端仍使用 `src/data/site.ts` 中的本地数据，接入 Strapi 后需要增加一个 CMS 客户端，并让页面数据优先从 Strapi 读取。

## 1. 已部署地址

| 项目         | 地址                             |
| ------------ | -------------------------------- |
| 前端         | `http://118.25.55.233/`          |
| Strapi Admin | `http://118.25.55.233/cms/admin` |
| Strapi API   | `http://118.25.55.233/cms/api`   |

所有 Strapi API 都通过 Nginx 的 `/cms/` 前缀访问。

## 2. 需要准备的数据

在 Strapi 后台完成以下准备：

1. 创建内容类型。
2. 添加至少一条已发布内容。
3. 创建只读 API Token。

内容类型字段以以下文档为准：

- `contracts/cms-content-model.json`
- `docs/cms-content-model.md`

建议至少创建：

- Product Line
- Equipment
- Certification
- Company Info

## 3. 创建 API Token

在 Strapi Admin 中：

1. 进入 Settings。
2. 进入 API Tokens。
3. 点击 Create new API Token。
4. Token type 选择 Read-only。
5. 到期时间选择合理期限。
6. 勾选需要读取的内容类型权限。
7. 创建并复制 Token。

Token 只允许保存在服务器端，不能提交到 Git，也不能使用 `PUBLIC_` 前缀暴露到浏览器。

## 4. 更新前端环境变量

编辑服务器上的 `/opt/cncmachining/.env`：

```dotenv
HOST=127.0.0.1
PORT=4321
PUBLIC_STRAPI_URL=http://118.25.55.233/cms
STRAPI_API_TOKEN=replace-with-your-readonly-token
```

更新后重启前端：

```bash
sudo systemctl restart cncmachining-web
```

## 5. 增加 CMS 客户端

建议新增 `src/lib/cms.ts`：

```ts
const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL ?? "http://127.0.0.1:1337";
const API_TOKEN = import.meta.env.STRAPI_API_TOKEN;

async function cmsFetch<T>(path: string): Promise<T> {
  const url = `${STRAPI_URL.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      ...(API_TOKEN ? { authorization: `Bearer ${API_TOKEN}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Strapi request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getProductLines() {
  return cmsFetch<StrapiCollectionResponse<ProductLine>>(
    "/api/product-lines?populate=*&sort=sortOrder:asc",
  );
}
```

需要根据真实 Strapi 响应补充类型定义，并用 Zod 校验，避免把不可信响应直接传给页面。

## 6. 替换本地数据

当前页面直接使用：

```ts
import { productLines } from "../data/site";
```

接入 Strapi 后可以改为：

```ts
const productLines = await getProductLines();
```

建议保留 `src/data/site.ts` 作为开发环境或构建失败时的 fallback，生产数据以 Strapi 为准。

## 7. 构建和重启

如果内容在构建阶段读取，修改内容后需要重新构建：

```bash
cd /opt/cncmachining
sudo -u ubuntu git pull
sudo -u ubuntu npm ci
sudo -u ubuntu npm run build
sudo systemctl restart cncmachining-web
```

如果页面使用 on-demand server rendering，也可以在运行时读取 Strapi，但仍建议为静态产品页保留构建阶段读取。

## 8. 验证接口

在服务器执行：

```bash
curl -s \
  -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://118.25.55.233/cms/api/product-lines?populate=*&sort=sortOrder:asc"
```

确认返回的是 Strapi JSON 结构，而不是错误页。

## 9. 常见问题

### `PUBLIC_STRAPI_URL` 带不带 `/cms`

需要带上 `/cms`，因为测试环境通过 Nginx 反向代理：

```text
http://118.25.55.233/cms
```

### 前端构建时读取不到内容

确认：

- Strapi 内容已经 Published。
- API Token 有读取权限。
- `/opt/cncmachining/.env` 已更新。
- `npm run build` 在环境变量加载之后执行。

### API 返回 403

检查 Strapi 内容类型的权限设置。使用 API Token 时，该 Token 必须包含对应集合的 `find` 和 `findOne` 权限。

### 更新后台内容后前端没变化

如果内容是构建阶段读取，更新后必须重新构建并重启前端。
