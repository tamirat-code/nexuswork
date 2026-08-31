# Reports

Milestone/progress reports for supervisors. This folder holds dated status
reports, not code documentation — nothing here is generated from the
codebase, since progress-to-date is inherently a point-in-time human
statement.

## Suggested format

Name each report `YYYY-MM-DD-status.md` (or per your advisor's convention)
and cover:

1. **What shipped since the last report** — link specific PRs/commits, or
   name the module(s) touched (cross-reference [`api/README.md`](../api/README.md)'s
   module table or [`database/README.md`](../database/README.md) for what
   "done" means for a given module).
2. **What's tested** — pull from [`testing/README.md`](../testing/README.md)
   rather than re-describing coverage from memory; it's kept current against
   the actual test suite.
3. **What's open** — reference [`requirements/README.md`](../requirements/README.md)'s
   status table (✅/🟡/⚠️/❌ per FR) for an honest, non-duplicated view of what
   remains.
4. **Risks / blockers** — e.g. the Chapa sandbox-verification gap flagged in
   [`architecture/phase-3-ethiopian-psp.md`](../architecture/phase-3-ethiopian-psp.md),
   or gates still open in [`deployment/production-readiness.md`](../deployment/production-readiness.md).

Keeping reports pointing at the living docs (rather than re-stating status
inline) means a report doesn't go stale the moment those docs are updated.
