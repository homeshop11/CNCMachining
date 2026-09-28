# CNCMachining

Lancoprecision 精密制造工厂官网的前端与项目配置仓库。

当前阶段为需求定稿和项目准备，代码实现尚未开始。

## 项目目标

面向美国、俄罗斯、英国、德国的 B2B 客户，展示 CNC 加工、车削、铣削、五轴加工和钣金制造能力。站点通过真实工厂信息、认证资质、设备数据、质量流程和清晰询盘路径建立信任，并支持非技术人员通过 Strapi 后台维护内容。

## 技术栈

- Astro
- Strapi 5
- Cloudflare Pages 与 Pages Functions
- PostgreSQL
- Tailwind CSS

## 文档索引

- 产品需求：[需求文档.md](./需求文档.md)
- Agent 约束：[AGENTS.md](./AGENTS.md)
- 架构说明：[docs/architecture.md](./docs/architecture.md)
- CMS 数据模型：[docs/cms-content-model.md](./docs/cms-content-model.md)
- 验收清单：[docs/acceptance-criteria.md](./docs/acceptance-criteria.md)
- Agent Skill 合约：[docs/agent-skill-contract.md](./docs/agent-skill-contract.md)
- CMS 机器契约：[contracts/cms-content-model.json](./contracts/cms-content-model.json)
- 询盘 API：[contracts/inquiry-api.openapi.yaml](./contracts/inquiry-api.openapi.yaml)
- 项目 Skill：[.codex/skills/cncmachining-web/SKILL.md](./.codex/skills/cncmachining-web/SKILL.md)
- 部署指南：[docs/deployment.md](./docs/deployment.md)
- Ubuntu 公网测试环境部署：[docs/deployment-ubuntu-test.md](./docs/deployment-ubuntu-test.md)
- 前端接入 Strapi：[docs/strapi-integration.md](./docs/strapi-integration.md)
- Strapi 后台使用说明：[docs/strapi-admin-guide.md](./docs/strapi-admin-guide.md)

## 目录结构

```text
.
├── 需求文档.md
├── AGENTS.md
├── README.md
├── package.json
├── docs/
├── contracts/
└── .codex/skills/cncmachining-web/
```

## 下一步

实现阶段建议按以下顺序推进：

1. 确认需求文档第 17.3 节的开放事项。
2. 初始化 Astro 与 Tailwind 项目结构。
3. 按 `contracts/cms-content-model.json` 创建 Strapi 内容类型。
4. 实现静态页面骨架和产品页动态读取。
5. 按 `contracts/inquiry-api.openapi.yaml` 实现询盘接口。
6. 按验收清单完成视觉、移动端、无障碍和 SEO 检查。
