# Proper OS integration notes

This branch is intentionally based on `agent/hr-auth-foundation` (PR #4) and preserves the newer HR, authentication, Marketing lead intake, estimate/proposal/contract, Production, and Proper University work.

Unique work carried forward from `proper-os/navigation-training-estimates` (PR #3):

- richer Company Pulse layout and top-three representative area
- dedicated Sales workspace
- grouped role-based navigation

The older `people` and `training` pages were not copied because Human Resources and Proper University supersede those routes in the newer branch.

Role navigation was adapted to the live Supabase `get_my_organizations()` response (`roles[]` and `permissions[]`) rather than the obsolete `role`/`department` fields used by PR #3.

Nothing on this branch changes or merges `main`, PR #3, or PR #4.
