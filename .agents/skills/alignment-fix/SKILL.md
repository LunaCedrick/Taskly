---
name: alignment-fix
description: "Maintain Taskly cross-session alignment before code changes. Use when prior sessions reveal contract drift, review warnings, stale IDs/APIs, scope ambiguity, or fixes that must first update AGENTS.md and affected skills before rerunning build sessions."
---

# Alignment Fix Skill

## Purpose

Keep Taskly's source-of-truth documents synchronized before code fixes.

Use this skill when a review or completed session finds a mismatch between existing code, `AGENTS.md`, and one or more session skills.

This is a maintenance skill, not a numbered build session. Do not treat it as Session 18.

## Required Reading

Read these files before making changes:

- `AGENTS.md`
- `.agents/skills/alignment-fix/SKILL.md`
- `.agents/ALIGNMENT_FIXES.md`

Read affected session skills only after identifying the fix item that applies.

## Allowed Files

This skill may update documentation and skill contracts only:

- `AGENTS.md`
- `.agents/ALIGNMENT_FIXES.md`
- `.agents/skills/*/SKILL.md`

Do not modify production code in this skill:

- `index.html`
- `style.css`
- `js/*.js`
- `config.example.js`
- `README.md`
- `DOCUMENTATION.md`

If code must change, write the required follow-up build skill in `.agents/ALIGNMENT_FIXES.md` and stop.

## Workflow

1. Read the active alignment ledger.
2. Confirm each fix item has:
   - problem
   - affected source-of-truth files
   - contract update
   - later code-fix session or explicit no-code outcome
3. Patch `AGENTS.md` first when the source of truth is wrong or incomplete.
4. Patch the affected skills next.
5. Update `.agents/ALIGNMENT_FIXES.md` with status and next action.
6. Validate every changed skill with `quick_validate.py`.
7. Run `git diff --check`.
8. Do not apply production code fixes in the same turn unless the user explicitly starts the relevant build/fix session after documentation validation.

## Ledger Rules

`.agents/ALIGNMENT_FIXES.md` is the active fix ledger.

Keep each item short and actionable:

- `Status`: `pending-docs`, `docs-patched`, `ready-for-code-fix`, `code-fixed`, or `closed`
- `Problem`: one concrete mismatch
- `Patch`: source-of-truth files to update
- `Code Fix`: the later build skill or focused fix that may touch production files
- `Review`: validation required before closing

Do not use the ledger as a changelog. Remove or mark closed items after they have been fixed and reviewed.

## Boundaries

- Do not combine two numbered build skills.
- Do not patch production code while aligning docs and skills.
- Do not weaken AGENTS rules to justify existing code unless the exception is deliberate and documented.
- If a code implementation conflicts with AGENTS, prefer updating code later unless AGENTS itself is clearly incomplete.
- If a skill conflicts with AGENTS, patch the skill to match AGENTS.
- If AGENTS and PLAN conflict, stop and report the conflict before patching.

## Validation

Run this for each changed skill folder:

```powershell
python C:\Users\Cedrick\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents\skills\<skill-name>
```

Then run:

```powershell
git diff --check
```

Use `.agents/skills/review/SKILL.md` after the alignment patch if the user wants a formal report.
