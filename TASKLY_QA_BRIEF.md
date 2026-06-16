# Taskly — Full Integration QA Pass
## Run as: Senior Software Engineer reviewing a colleague's PR before deploy
## Trigger: Session 13 (app.js orchestration) is complete — all modules now wired
## Status: Pre-deployment functional + UX audit

---

## ROLE

You are acting as a Senior Software Engineer doing a thorough pre-release
review of this codebase. This is NOT a new build session — do not add
features. Your job is to:

1. Test the app end-to-end as a real user would
2. Verify it matches AGENTS.md and PLAN.md specifications
3. Find bugs, broken flows, visual issues, and edge cases
4. Suggest improvements — clearly separated from required fixes

---

## REQUIRED READING FIRST

- `AGENTS.md` — architecture, module boundaries, design system, error
  messages, naming conventions
- `PLAN.md` §3 (Success Indicators) and §18 (Testing Strategy) — these
  define what "done" means for v1.0
- `.agents/skills/review/SKILL.md` — code-level audit rules (run this too,
  but it is not sufficient on its own — this pass goes further)

---

## SCOPE — WHAT TO TEST

This is the first session where ALL modules are wired together
(config → auth → router → db → ui → app). Test the full data flow:

```
User action → app.js → db.js/auth.js → Firebase → onSnapshot →
app.js updates state → ui.js re-renders → user sees result
```

Do NOT modify code unless fixing a confirmed ❌ bug. If you find an
issue, report it first using the format in Section "REPORT FORMAT"
below — only fix it after confirming it's in scope (see "WHAT NOT TO
FIX" at the end).

---

## TEST AREA 1 — AUTHENTICATION

- [ ] Sign in with Google → popup opens → completes → dashboard shown
- [ ] Page refresh after sign-in → still signed in, no flash of login view
- [ ] User profile (photo, name) appears correctly in sidebar
- [ ] Sign out → confirmation modal appears → confirm → returns to login
- [ ] Sign out → cancel → user remains signed in
- [ ] Close tab, reopen → session persists
- [ ] First login → notification permission prompt appears (if not
      previously granted/denied)
- [ ] `users/{uid}/profile/data` document exists in Firestore with
      correct name/email/photoURL

---

## TEST AREA 2 — NAVIGATION & ROUTING

- [ ] Click "Dashboard" nav item → dashboard view shows, nav item
      highlighted active
- [ ] Click "My Tasks" nav item → correct view shows
- [ ] Click a project in sidebar → switches to project view, topbar
      title updates to project name
- [ ] Click "Settings" (if accessible from nav) → settings view shows,
      FAB hidden
- [ ] Switching views never shows two content sections at once
- [ ] Switching views never leaves stale data from the previous view
      visible momentarily
- [ ] No console errors during any navigation action
- [ ] Hamburger menu (mobile width) — does it exist/function, or is
      this deferred to Session 15 (responsive)? If deferred, confirm
      it's not silently broken at desktop width

---

## TEST AREA 3 — PROJECT CRUD (Session 7)

- [ ] Click "+ New Project" → modal/prompt appears
- [ ] Create project with valid name → appears in sidebar immediately
      (real-time, no refresh)
- [ ] Create project with empty name → rejected with
      "Please enter a project name."
- [ ] Create project with duplicate name → rejected with
      "A project with this name already exists."
- [ ] Project progress bar shows correct completed/total ratio
- [ ] Rename a project → sidebar and topbar (if active) update
- [ ] Delete project → confirmation modal warns tasks will be deleted
- [ ] Confirm delete → project AND all its tasks removed from
      Firestore and UI
- [ ] Cancel delete → project remains untouched

---

## TEST AREA 4 — TASK CRUD (Session 8)

- [ ] Click "+ Add Task" (topbar) → modal opens with empty form
- [ ] Click FAB (+) → same modal opens
- [ ] Create task with title only → appears in list, default
      priority/status applied
- [ ] Create task with all fields (title, description, due date,
      priority, category) → all fields render correctly on the card
- [ ] Create task with empty title → rejected with
      "Please enter a task title."
- [ ] Edit task (pencil icon) → modal opens pre-filled with current
      values
- [ ] Save edit → card updates immediately, `updatedAt` changes
- [ ] Click checkbox → task marked done (strikethrough/muted style),
      stats update in real time
- [ ] Uncheck a done task → reverts to todo styling
- [ ] Delete task (trash icon) → confirmation shown
- [ ] Confirm delete → task disappears from list and Firestore
- [ ] New task includes `userId` field in Firestore (check console)

---

## TEST AREA 5 — SORTING & HIGHLIGHTING (Session 8)

- [ ] Tasks sorted by due date ascending — soonest first
- [ ] Tasks with no due date appear at the bottom of the list
- [ ] Overdue task (due date in the past, status != done) → red
      background (`.task-card--overdue`)
- [ ] Task due today → amber background (`.task-card--today`)
- [ ] Completed task → muted/strikethrough style, NOT highlighted as
      overdue even if its due date is in the past

---

## TEST AREA 6 — DASHBOARD (Session 6 + 13 wiring)

- [ ] Dashboard loads with real data (not mock) on sign-in
- [ ] Stats cards (Total/Completed/In Progress/Overdue) match actual
      counts across ALL projects
- [ ] Overdue section shows only overdue, incomplete tasks from ALL
      projects
- [ ] Today section shows only today's incomplete tasks from ALL
      projects
- [ ] Upcoming section shows incomplete tasks due after today
- [ ] Completed tasks do NOT appear in Overdue/Today/Upcoming sections
- [ ] Recent Activity feed shows latest events in reverse
      chronological order
- [ ] Create a task in Project A → dashboard Overdue/Today/Upcoming
      updates without refresh
- [ ] **Listener resilience test**: delete a project that has tasks
      while dashboard is open → dashboard does NOT get stuck on an
      error state; it recovers and continues showing live data
      (see AGENTS.md "Listener Resilience" section — this is the
      Session 4 finding that Session 13 was required to handle)

---

## TEST AREA 7 — SEARCH & FILTER (Session 9)

- [ ] Type in search bar → task list filters in real time
- [ ] Search matches title, description, AND category
- [ ] Clear search → full list returns
- [ ] Search debounce — typing fast doesn't cause lag or excessive
      re-renders (rough check, not a perf benchmark)
- [ ] Filter by status (To Do/In Progress/Done) → list updates
- [ ] Filter by priority → list updates
- [ ] Filter by category → list updates
- [ ] Combine search + filters → intersection result shown correctly
- [ ] No results (search or filter) → "No tasks match your search"
      empty state shown
- [ ] No Firestore reads triggered by search/filter (check Network
      tab or Firestore usage — should be zero additional reads)

---

## TEST AREA 8 — NOTIFICATIONS (Session 10)

- [ ] In-app alert banner appears on dashboard if tasks are overdue
      or due today
- [ ] Banner is dismissible, stays dismissed for the session
- [ ] Notification bell shows unread count badge
- [ ] Click bell → notification panel opens, lists notifications with
      timestamps
- [ ] Mark as read → badge count decreases
- [ ] Clear all → confirmation shown, then panel empties
- [ ] If browser notification permission was granted: does a task
      becoming overdue while the app is open trigger a browser
      notification? (Test if feasible — may require waiting or
      manipulating a due date to "now")
- [ ] If permission was denied: confirm no repeat permission prompts

---

## TEST AREA 9 — OFFLINE BEHAVIOR (Session 11)

- [ ] Open DevTools → Network tab → set to "Offline"
- [ ] Offline banner appears: "Offline Mode — Changes will sync
      automatically"
- [ ] Existing tasks/projects still visible (from cache)
- [ ] Create a new task while offline → appears in list immediately
- [ ] Edit/delete/complete a task while offline → UI updates
      immediately
- [ ] Set Network back to "Online"
- [ ] Offline banner disappears
- [ ] Changes made offline sync to Firestore (verify in console)

---

## TEST AREA 10 — SETTINGS (Session 12)

- [ ] Settings view shows profile: name, email, photo from Google
- [ ] Notification permission status displayed accurately
- [ ] Toggle/enable notifications from settings (if permission was
      previously denied, confirm it explains how to enable via
      browser settings rather than re-prompting)
- [ ] Sign out from settings → confirmation modal → works same as
      sidebar sign out
- [ ] Theme section shows placeholder for dark mode (v2) — confirm
      it's clearly inert, not a broken toggle

---

## TEST AREA 11 — REAL-TIME SYNC (cross-tab)

- [ ] Open the app in two browser tabs (same account)
- [ ] Create a task in Tab 1 → appears in Tab 2 without refresh
- [ ] Complete a task in Tab 2 → Tab 1 reflects the change
- [ ] Delete a project in Tab 1 → Tab 2's sidebar updates, and if
      Tab 2 was viewing that project, it handles the missing project
      gracefully (per AGENTS.md §7: "This project no longer exists.")

---

## TEST AREA 12 — ERROR HANDLING

- [ ] Disconnect network before any Firestore write → human-readable
      error shown, not a raw Firebase error code
- [ ] All error banners are dismissible
- [ ] Error banners use `role="alert"`
- [ ] No error ever appears ONLY in the console — always visible
      in the UI too

---

## TEST AREA 13 — VISUAL / DESIGN SYSTEM CONSISTENCY

Compare against AGENTS.md §2 design tokens:

- [ ] Sidebar is deep indigo (`#1e1b4b`), active nav item has violet
      highlight + right border
- [ ] Background is light lavender (`#f5f4ff`), cards are white
- [ ] All buttons use correct colors (primary violet, danger red,
      ghost transparent/bordered)
- [ ] Priority dots: red/amber/green/grey with text labels alongside
      (never color alone)
- [ ] Overdue = red tint, Today = amber tint — consistent everywhere
      (task cards AND dashboard sections)
- [ ] DM Sans font visible throughout, correct weights for headings
      vs body vs stats numbers
- [ ] No layout breaks, overlapping elements, or unstyled raw HTML
      anywhere in the flows tested above
- [ ] Modals are centered, white, rounded, with proper shadow —
      Cancel (ghost) + primary/danger action aligned right

---

## TEST AREA 14 — ACCESSIBILITY (BASIC PASS — full pass is Session 16)

- [ ] Tab key moves focus through interactive elements in a logical
      order
- [ ] Every icon-only button (edit, delete, dismiss, bell, hamburger)
      has an accessible label (hover or inspect for aria-label)
- [ ] Modals trap focus is NOT required yet (Session 16) — but note
      if Escape key currently does anything unexpected
- [ ] Color is never the only signal (re-confirm priority labels,
      overdue/today sections have text headers, not just color)

---

## TEST AREA 15 — CODE-LEVEL SANITY (cross-check, not full audit)

- [ ] `state.listeners` array — after sign-out, are all listeners
      detached? (Check via console: sign out, then verify no
      Firestore activity continues — e.g. set network offline,
      sign out, sign back in, confirm no duplicate/ghost listeners
      causing double-renders)
- [ ] No `console.log` statements anywhere (final check)
- [ ] No `innerHTML` usage anywhere (final check)
- [ ] `git status` clean — no `config.js`, no stray files

---

## REPORT FORMAT

```
TASKLY — FULL INTEGRATION QA REPORT
Date: [date]
Tested by: Codex (Senior Engineer pass)

SUMMARY
✅ PASS  : [count]
⚠️ ISSUE : [count]  (functional bugs — must fix before deploy)
💡 SUGGESTION : [count]  (improvements — optional, your call)

ISSUES — confirmed bugs, blocking deploy
❌ [Test Area] — [what's broken] — [steps to reproduce] —
   [suggested fix, if obvious]

SUGGESTIONS — improvements, not bugs
💡 [Area] — [what you noticed] — [why it'd help] —
   [effort estimate: trivial/small/medium]

WHAT WORKS WELL
- [Call out 2-3 things that are genuinely solid — this matters
  for morale and for knowing what NOT to touch]

DEPLOYMENT READINESS
[READY FOR SESSIONS 14-17] or [FIX ISSUES FIRST — list blocking items]
```

---

## WHAT NOT TO FIX IN THIS SESSION

These are explicitly OUT of scope for this QA pass — report them as
suggestions only, do not implement:

- Full responsive/mobile pass — that's Session 15
- Full accessibility pass (focus traps, Escape-to-close) — Session 16
- PWA manifest, deployment config — Session 17
- Dark mode — v2, explicitly out of scope per PLAN.md §5
- Any new feature not already in AGENTS.md §1/§5

If you find a genuine ❌ bug (not a missing future-session feature),
fix it — but keep the fix minimal and scoped to the broken behavior
only. Re-run `.agents/skills/review/SKILL.md` after any fix and report
the diff clearly.