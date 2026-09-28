# Strapi Admin Guide

本文档是测试环境的 Strapi 5 后台使用说明。

## 1. 登录地址

```text
http://118.25.55.233/cms/admin
```

首次访问时创建管理员账号。管理员账号只保存在服务器端，不写入当前仓库。

## 2. 核心区域

| 区域                 | 用途                            |
| -------------------- | ------------------------------- |
| Content Manager      | 创建、编辑、发布内容            |
| Content-Type Builder | 创建内容类型和字段              |
| Media Library        | 上传图片、PDF 等媒体            |
| Settings             | 角色、权限、API Token、国际化等 |

## 3. 创建内容类型

进入 Content-Type Builder：

1. 点击 Create new collection type。
2. 输入 Display name。
3. 按契约添加字段。
4. 保存内容类型。

示例 Product Line 字段：

| 字段名            | 类型      | 说明           |
| ----------------- | --------- | -------------- |
| slug              | Text      | URL 标识，唯一 |
| name              | Text      | 产品线名称     |
| summary           | Text      | 页面摘要       |
| description       | Rich text | 详细说明       |
| materials         | Component | 材料列表       |
| specifications    | Component | 规格表         |
| tolerances        | Component | 公差范围       |
| surfaceTreatments | Component | 表面处理       |
| applications      | Component | 应用行业       |
| leadTime          | Text      | 标准交期       |
| images            | Media     | 产品图片       |
| sortOrder         | Number    | 排序           |

字段细节以 `contracts/cms-content-model.json` 和 `docs/cms-content-model.md` 为准。

## 4. 发布内容

在 Content Manager 中创建内容后，默认是 Draft。只有点击 Publish 后，API 才会返回该内容。

## 5. 媒体库

上传图片时建议：

- 使用真实工厂、设备或产品照片。
- 填写 Alternative text。
- 命名清晰，避免重复文件名。
- 控制图片体积，减少前端加载时间。

## 6. API Token

进入 Settings -> API Tokens：

1. 点击 Create new API Token。
2. 选择 Read-only。
3. 勾选需要读取的内容类型。
4. 创建后立即复制 Token。

Token 写入服务器 `/opt/cncmachining/.env` 的 `STRAPI_API_TOKEN`。

## 7. 角色与权限

测试环境建议：

- Public 角色默认不开放内容读取。
- 前端读取使用只读 API Token。
- 编辑内容只允许管理员账号。

## 8. 更新内容后生效

当前架构如果采用构建阶段读取，后台发布内容后需要：

```bash
cd /opt/cncmachining
sudo -u ubuntu npm run build
sudo systemctl restart cncmachining-web
```

## 9. 数据备份

数据库备份：

```bash
sudo -u postgres pg_dump cncmachining_cms > /tmp/cncmachining-cms-backup.sql
```

上传文件备份：

```bash
sudo tar -czf /tmp/cncmachining-cms-uploads.tar.gz /opt/cncmachining-cms/public/uploads
```

## 10. 测试 API

```bash
curl -s \
  -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://118.25.55.233/cms/api/product-lines?populate=*"
```
