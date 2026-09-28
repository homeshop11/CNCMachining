# Ubuntu Public IP Test Environment Deployment

本文档是独立的测试环境部署说明，适用于一台拥有公网 IP 的 Ubuntu 服务器。目标是把当前 Astro 前端和 Strapi 后端分别部署为 systemd 服务，通过 Nginx 暴露到公网。

## 1. 部署目标

### 1.1 目标拓扑

```text
Public IP:80
    |
    v
  Nginx
    |-- /            -> 127.0.0.1:4321  Astro frontend
    `-- /cms/        -> 127.0.0.1:1337  Strapi backend

PostgreSQL: 127.0.0.1:5432
```

### 1.2 端口规划

| 服务           | 内部监听地址     | 公网暴露方式       |
| -------------- | ---------------- | ------------------ |
| Nginx          | `0.0.0.0:80`     | 公网 IP 的 80 端口 |
| Astro frontend | `127.0.0.1:4321` | 不直接暴露         |
| Strapi backend | `127.0.0.1:1337` | 通过 `/cms/` 反代  |
| PostgreSQL     | `127.0.0.1:5432` | 不暴露公网         |

## 2. 前置条件

- Ubuntu 22.04 或 24.04。
- 公网 IP 可访问。
- 有 `sudo` 权限。
- 前端代码已放入 Git 仓库，或已通过其他方式传到服务器。
- 预留一个 Strapi 管理账号和 PostgreSQL 数据库密码。

示例变量：

```bash
PUBLIC_IP=203.0.113.10
APP_USER=deploy
DB_NAME=cncmachining_cms
DB_USER=strapi
DB_PASSWORD=replace-with-a-strong-password
```

下文把 `PUBLIC_IP`、`APP_USER`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` 当作占位符。

## 3. 安装系统依赖

```bash
sudo apt update
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib ufw
```

安装 Node.js 22：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

启用 PostgreSQL 和 Nginx：

```bash
sudo systemctl enable --now postgresql
sudo systemctl enable --now nginx
```

## 4. 创建运行用户与目录

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
sudo mkdir -p /opt/cncmachining /opt/cncmachining-cms
sudo chown -R "$APP_USER:$APP_USER" /opt/cncmachining /opt/cncmachining-cms
```

部署时可以用普通用户拉取代码，再把文件复制到 `/opt/cncmachining`，最后统一修改属主。

## 5. 部署 Astro 前端

### 5.1 拉取代码

```bash
sudo -u "$APP_USER" git clone https://github.com/your-org/cncmachining.git /opt/cncmachining
cd /opt/cncmachining
sudo -u "$APP_USER" npm ci
```

如果代码不是通过 Git 拉取，将项目文件放到 `/opt/cncmachining` 后执行：

```bash
sudo chown -R "$APP_USER:$APP_USER" /opt/cncmachining
cd /opt/cncmachining
sudo -u "$APP_USER" npm ci
```

### 5.2 修改站点地址

编辑 `astro.config.mjs`：

```js
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [tailwind()],
  site: `http://${process.env.PUBLIC_IP || "localhost"}`,
});
```

如果配置中直接写死地址，构建时改为：

```js
site: 'http://203.0.113.10',
```

### 5.3 创建环境变量文件

```bash
sudo tee /opt/cncmachining/.env >/dev/null <<'EOF'
HOST=127.0.0.1
PORT=4321
PUBLIC_STRAPI_URL=http://PUBLIC_IP/cms
STRAPI_API_TOKEN=replace-with-strapi-token
RESEND_API_KEY=replace-me
INQUIRY_TO_EMAIL=inquiry@example.com
EOF
sudo chown "$APP_USER:$APP_USER" /opt/cncmachining/.env
sudo chmod 600 /opt/cncmachining/.env
```

当前测试环境可以不填 Resend 和 Strapi Token，询盘接口仍会返回本地受理结果。

### 5.4 构建前端

```bash
cd /opt/cncmachining
sudo -u "$APP_USER" env PUBLIC_IP="$PUBLIC_IP" npm run build
```

构建完成后应存在：

```text
/opt/cncmachining/dist/client/
/opt/cncmachining/dist/server/entry.mjs
```

### 5.5 手动验证前端

```bash
cd /opt/cncmachining
sudo -u "$APP_USER" env HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

在另一个终端验证：

```bash
curl -I http://127.0.0.1:4321/
curl -I http://127.0.0.1:4321/products/cnc-machining
```

确认返回 200 后停止手动进程。

### 5.6 配置 systemd

创建 `/etc/systemd/system/cncmachining-web.service`：

```ini
[Unit]
Description=CNC Machining Astro frontend
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/cncmachining
EnvironmentFile=/opt/cncmachining/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/cncmachining/dist/server/entry.mjs
Restart=always
RestartSec=5
TimeoutStopSec=20

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cncmachining-web
sudo systemctl status cncmachining-web
```

查看日志：

```bash
sudo journalctl -u cncmachining-web -f
```

## 6. 配置 Nginx 反代前端

创建 `/etc/nginx/sites-available/cncmachining`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /cms/ {
        proxy_pass http://127.0.0.1:1337/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/cncmachining /etc/nginx/sites-enabled/cncmachining
sudo nginx -t
sudo systemctl reload nginx
```

访问：

```text
http://PUBLIC_IP/
```

## 7. 部署 Strapi 后端

### 7.1 创建 PostgreSQL 数据库和用户

```bash
sudo -u postgres psql <<'SQL'
CREATE USER strapi WITH PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE cncmachining_cms OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE cncmachining_cms TO strapi;
SQL
```

### 7.2 创建 Strapi 项目

```bash
cd /opt
sudo -u "$APP_USER" npx create-strapi-app@latest cncmachining-cms \
  --quickstart \
  --no-run \
  --dbclient=postgres \
  --dbhost=127.0.0.1 \
  --dbport=5432 \
  --dbname="$DB_NAME" \
  --dbusername="$DB_USER" \
  --dbpassword="$DB_PASSWORD"
```

如果命令没有自动生成数据库配置，手工创建 `.env`：

```dotenv
HOST=127.0.0.1
PORT=1337
APP_KEYS=replace-with-random-app-keys
API_TOKEN_SALT=replace-with-random-api-token-salt
ADMIN_JWT_SECRET=replace-with-random-admin-secret
JWT_SECRET=replace-with-random-jwt-secret
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=cncmachining_cms
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=replace-with-a-strong-password
DATABASE_SSL=false
```

### 7.3 配置 Strapi 反向代理路径

编辑 `config/server.js`：

```js
module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS"),
  },
  url: env("PUBLIC_URL", "http://127.0.0.1:1337"),
});
```

在 `/opt/cncmachining-cms/.env` 增加：

```dotenv
PUBLIC_URL=http://PUBLIC_IP/cms
```

`PUBLIC_IP` 替换为实际公网 IP。

### 7.4 构建并启动 Strapi

```bash
cd /opt/cncmachining-cms
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm run build
sudo -u "$APP_USER" env NODE_ENV=development npm run develop
```

确认服务在 `127.0.0.1:1337` 可访问后，停止手动进程。

### 7.5 配置 systemd

创建 `/etc/systemd/system/cncmachining-cms.service`：

```ini
[Unit]
Description=CNC Machining Strapi backend
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/cncmachining-cms
EnvironmentFile=/opt/cncmachining-cms/.env
Environment=NODE_ENV=development
ExecStart=/usr/bin/npm run develop
Restart=always
RestartSec=5
TimeoutStopSec=20

[Install]
WantedBy=multi-user.target
```

测试环境使用 `npm run develop`，以便在后台编辑 Content Type。内容类型稳定、准备正式发布前，再把 Strapi 服务切回：

```ini
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cncmachining-cms
sudo systemctl status cncmachining-cms
```

查看日志：

```bash
sudo journalctl -u cncmachining-cms -f
```

## 8. 初始化 Strapi 内容

### 8.1 创建管理员

访问：

```text
http://PUBLIC_IP/cms/admin
```

第一次访问时创建管理员账号。

### 8.2 创建内容类型

按以下文档创建内容类型：

- `contracts/cms-content-model.json`
- `docs/cms-content-model.md`

至少创建：

- Product Line
- Equipment
- Certification
- Case Study
- Company Info
- Page

### 8.3 生成 API Token

在 Strapi Admin 中：

1. 进入 Settings。
2. 进入 API Tokens。
3. 创建只读 Token。
4. 把 Token 写入 `/opt/cncmachining/.env` 的 `STRAPI_API_TOKEN`。
5. 重启前端：

```bash
sudo systemctl restart cncmachining-web
```

## 9. 当前前端与 Strapi 的集成说明

当前前端页面使用 `src/data/site.ts` 中的本地数据。测试环境可以先完成前端和 Strapi 的独立部署，再在后续开发中把产品、设备、认证和公司信息改为从 Strapi 读取。

连接变量：

```dotenv
PUBLIC_STRAPI_URL=http://PUBLIC_IP/cms
STRAPI_API_TOKEN=replace-with-strapi-token
```

## 10. 公网测试

开放防火墙：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
sudo ufw status
```

验证：

```bash
curl -I "http://$PUBLIC_IP/"
curl -I "http://$PUBLIC_IP/products/cnc-machining"
curl -I "http://$PUBLIC_IP/cms/admin"
curl -X POST "http://$PUBLIC_IP/api/inquiry" \
  -H 'content-type: application/json' \
  -d '{"name":"Test Buyer","email":"buyer@example.com","company":"Example","message":"Test inquiry message","consent":true,"website":""}'
```

最后一个命令应返回：

```json
{
  "status": "accepted"
}
```

## 11. 更新发布

### 11.1 更新前端

```bash
cd /opt/cncmachining
sudo -u "$APP_USER" git pull
sudo -u "$APP_USER" npm ci
sudo -u "$APP_USER" env PUBLIC_IP="$PUBLIC_IP" npm run build
sudo systemctl restart cncmachining-web
```

### 11.2 更新 Strapi

```bash
cd /opt/cncmachining-cms
sudo -u "$APP_USER" git pull
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm run build
sudo systemctl restart cncmachining-cms
```

更新前先备份 PostgreSQL：

```bash
sudo -u postgres pg_dump cncmachining_cms > /tmp/cncmachining-cms-$(date +%F-%H%M%S).sql
```

## 12. 回滚

前端回滚到上一个 Git 提交：

```bash
cd /opt/cncmachining
sudo -u "$APP_USER" git checkout <previous-commit>
sudo -u "$APP_USER" npm ci
sudo -u "$APP_USER" env PUBLIC_IP="$PUBLIC_IP" npm run build
sudo systemctl restart cncmachining-web
```

Strapi 回滚时，优先从备份恢复数据库，再切换代码版本：

```bash
sudo -u postgres psql cncmachining_cms < /tmp/cncmachining-cms-backup.sql
```

## 13. 常见问题

### 前端服务启动后立即退出

查看：

```bash
sudo journalctl -u cncmachining-web -n 100
```

确认：

- `dist/server/entry.mjs` 存在。
- `/opt/cncmachining/.env` 的属主和权限正确。
- `npm run build` 已成功执行。

### 公网无法访问 80 端口

确认云服务商安全组已放行 TCP 80 端口，同时 Ubuntu `ufw` 已放行：

```bash
sudo ufw status
```

### Strapi 管理后台样式或资源加载失败

确认 `PUBLIC_URL` 已设置为：

```text
http://PUBLIC_IP/cms
```

并确认 Nginx 中 `/cms/` 的 `proxy_pass` 使用尾部斜杠：

```nginx
proxy_pass http://127.0.0.1:1337/;
```

### 询盘接口 404

当前生产测试环境使用 `@astrojs/node` 的 server 输出，接口位于：

```text
src/pages/api/inquiry.ts
```

确认前端服务已重启，并通过：

```bash
curl -I "http://127.0.0.1:4321/api/inquiry"
```

检查本地服务。

## 14. 安全建议

- 生产化前把 HTTP 替换为 HTTPS，使用 Cloudflare 或 Nginx 证书。
- 不公开 PostgreSQL 5432 端口。
- 不公开 Strapi 1337 端口。
- 定期备份数据库和上传文件。
- 将 `.env` 设置为仅运行用户可读。
- 使用强随机值生成 Strapi 的 `APP_KEYS`、`ADMIN_JWT_SECRET`、`JWT_SECRET`。
