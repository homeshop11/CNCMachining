---
name: cncmachining-web
description: Build and maintain the Lancoprecision manufacturing website with Astro, Strapi, and Cloudflare Pages while preserving its inquiry, CMS, SEO, responsive, and privacy constraints.
---

# CNC Machining Web

Use this skill when working on the Lancoprecision manufacturing capability website. Its scope covers requirements, architecture, CMS integration, inquiry handling, SEO, deployment, and acceptance checks for this repository.

## Source Of Truth

Read these files before changing implementation or contracts:

- `../../../需求文档.md`
- `../../../AGENTS.md`
- `../../../docs/architecture.md`
- `../../../docs/cms-content-model.md`
- `../../../docs/agent-skill-contract.md`
- `../../../contracts/cms-content-model.json`
- `../../../contracts/inquiry-api.openapi.yaml`

## Workflow

1. Identify the affected requirement ID or contract.
2. Check whether the task is inside the phase-one scope.
3. Update the relevant requirement, CMS, or API contract before implementing contract changes.
4. Implement with Astro, Tailwind CSS, and TypeScript conventions from `AGENTS.md`.
5. Verify build, type checking, responsive layout, accessibility, SEO, and inquiry behavior.

## Non-Negotiable Constraints

- Do not auto-play music or video.
- Keep product line content CMS-driven.
- Validate inquiry and attachment data on the server.
- Never commit secrets or customer-private data.
- Support 360px to 1440px without horizontal scrolling, overlap, or truncation.
- Keep the first phase English-first and avoid out-of-scope commerce, quote, login, or chatbot features.

## Contract Changes

When a CMS field, route, or inquiry request changes:

- Update `contracts/cms-content-model.json` or `contracts/inquiry-api.openapi.yaml`.
- Update the corresponding documentation.
- Keep the public slug and field names stable unless the change is explicitly approved.

## Completion Checklist

- `npm run check` passes.
- `npm run build` passes.
- Desktop and mobile visual checks pass.
- No new accessibility or security regressions.
- Updated docs and contracts match the implementation.
