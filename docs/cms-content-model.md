# CMS Content Model

本文档是 Strapi 内容模型的业务说明，机器可读契约见 `../contracts/cms-content-model.json`。

## 1. 通用原则

- 内容类型使用复数 API ID。
- 对外字段命名保持稳定。
- 所有内容类型必须支持草稿与发布状态。
- 媒体必须包含 alt 文本和响应式尺寸。
- slug 使用小写连字符格式，不允许重复。
- 产品线、设备、认证和案例可通过关系引用。

## 2. Product Line

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| slug | string | 是 | URL 标识，唯一且稳定 |
| name | string | 是 | 产品线名称 |
| summary | text | 是 | 页面摘要 |
| description | richtext | 是 | 详细能力说明 |
| materials | component list | 是 | 材料列表 |
| specifications | component list | 是 | 规格表 |
| tolerances | component list | 否 | 公差范围 |
| surfaceTreatments | component list | 否 | 表面处理 |
| applications | component list | 否 | 应用行业 |
| leadTime | string | 否 | 标准交期说明 |
| images | media list | 是 | 产品图，需 alt |
| sortOrder | integer | 否 | 列表排序 |

## 3. Equipment

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 设备名称 |
| model | string | 是 | 型号 |
| quantity | integer | 是 | 数量 |
| capability | text | 是 | 加工能力 |
| image | media | 否 | 设备图，需 alt |
| status | enum | 是 | `active` 或 `inactive` |
| productLines | relation | 否 | 关联产品线 |

## 4. Certification

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 证书名称 |
| issuer | string | 是 | 颁发机构 |
| validFrom | date | 否 | 生效日期 |
| validUntil | date | 否 | 有效期 |
| document | media | 是 | 图片或 PDF |
| sortOrder | integer | 否 | 排序 |

## 5. Case Study

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| industry | string | 是 | 应用行业 |
| title | string | 是 | 案例标题 |
| summary | text | 是 | 案例说明 |
| image | media | 否 | 配图，需 alt |
| productLines | relation | 否 | 关联产品线 |

## 6. Company Info

Company Info 为单例内容类型，避免重复创建多条记录。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| companyName | string | 是 | 公司名称 |
| address | text | 是 | 物理地址 |
| phone | string | 是 | 固定电话 |
| email | string | 是 | 商务邮箱 |
| whatsapp | string | 是 | WhatsApp 号码 |
| linkedin | string | 否 | LinkedIn 主页 |
| privacyPolicyUrl | string | 是 | 隐私政策地址 |

## 7. Page

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| slug | string | 是 | 页面 URL 标识 |
| title | string | 是 | 页面标题 |
| metaTitle | string | 否 | SEO 标题 |
| metaDescription | text | 否 | SEO 描述 |
| localizedContent | dynamiczone | 否 | 本地化内容区块 |
| status | enum | 是 | `draft` 或 `published` |
