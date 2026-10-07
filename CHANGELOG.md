# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Intuit 301 copy** — Rebuilt as TurboTax Expert Ops for the Intuit × Cursor 301 session on October 8, 2026: synthetic filers, tax year 2025 returns with W-2, 1099-INT, and 1098-T forms, an e-file reject queue, and education-credit reviews capped at the 2025 limits. One `301` runbook track follows the session deck. The `decompose-feature` and `create-api` project skills, `turbotax-reviewer`, and `acceptance-verifier` back the two live demos. The shipped suite is green.

### Removed

- The Ledgerly billing domain, the 101 and 201 tracks, Linear staging, the standard-bug-fix disk plugin, and the Collections Command Center PRD.

## [1.0.0] - 2026-09-15

First stable release of Ledgerly as the CE field-demo app for Adopting Grok Build for AI Development.

### Released

- **101 track** — Runbooks track `101` / `RUNBOOK_SECTIONS_101` released for CE workshop demos (Adopting Grok Build for AI Development). Workshop beats are aligned to the Adopting Grok Build Outline.

### Added

- Ledgerly demo app: Fieldnote Workspace billing ops (dashboard, invoices, collections, disputes, runbooks, settings). Catalog prices stay Starter $49, Growth $99, Scale $249.
- Jumpable runbook pages at `/runbooks/101` and `/runbooks/201` with copy-paste beats; presenter run-of-show in `demo-howto.md`.
- Project agents (`ledgerly-reviewer`, `api-instrumenter`, `dispute-verifier`) and skills for demo reset, Prisma lookups, workflow choice, and Cloud Agent handoff.

### Changed

- 101 govern-rule, MCP/Figma, and checkpoint-restore beats synced to the Adopting Grok Build Outline Show wording.

[Unreleased]: https://github.com/joatmon08x/ce-field-demos/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/joatmon08x/ce-field-demos/releases/tag/v1.0.0
