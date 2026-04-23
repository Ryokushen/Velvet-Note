---
tags: [fragrance-app, expo, project]
---

# Fragrance-App-Phase-1 — Docs

**Goal:** Execute Phase 1 implementation plan for the Fragrance App (26 tasks total).

**Execution-mode decision required:**
- `subagent-driven` — use `subagent-driven-development` skill, delegate to Claude Code subprocess workers
- `inline-batched` — run tasks sequentially in current session

**Key paths:**
- Plan: `Projects/Fragrance App/Fragrance App - Phase 1 Implementation Plan.md`
- Target repo: `~/Artificial/Obsidian/Fragrance App/` (scaffold does not exist yet)

**Gotchas:**
- Repo does not yet exist — Task 1 is pure scaffold creation, no existing code to touch
- Telegram CLI unavailable on Darter Pro — cannot ping Charles via CLI
- Telegram card API (`telegram_card`) available as fallback notification path
- Decision stall is external — no agent-side mechanical action can advance this task

**Notes for next session:**
- Wait for Charles's reply with execution mode before beginning
- Once mode confirmed, say "go ahead" and replayer will begin Task 1
