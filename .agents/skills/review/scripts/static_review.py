#!/usr/bin/env python3
"""Read-only static QA runner for Taskly."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
PRODUCTION_DIRS = ("js",)
PRODUCTION_FILES = ("index.html", "style.css", "config.example.js")
JS_FILES = ("auth.js", "router.js", "db.js", "ui.js", "app.js")
CANONICAL_SCRIPT_ORDER = [
    "js/config.js",
    "js/auth.js",
    "js/router.js",
    "js/db.js",
    "js/ui.js",
    "js/app.js",
]
FIREBASE_CDN_ORDER = [
    "firebase-app-compat.js",
    "firebase-auth-compat.js",
    "firebase-firestore-compat.js",
    "firebase-messaging-compat.js",
]
REQUIRED_STATE_KEYS = [
    "user",
    "currentProjectId",
    "projects",
    "tasks",
    "dashboardData",
    "filters",
    "searchQuery",
    "notifications",
    "unreadCount",
    "listeners",
    "isOffline",
]
STALE_TERMS = [
    "notification-count",
    "dashboard-view",
    "project-view",
    "#content",
    "getProjects",
    "getTasks",
    "subscribeToProjects",
    "subscribeToTasks",
    "logout",
]


@dataclass
class Finding:
    """Represents one audit finding."""

    level: str
    section: str
    message: str


class Review:
    """Collects audit findings."""

    def __init__(self) -> None:
        self.findings: list[Finding] = []

    def pass_(self, section: str, message: str) -> None:
        self.findings.append(Finding("PASS", section, message))

    def warn(self, section: str, message: str) -> None:
        self.findings.append(Finding("WARN", section, message))

    def fail(self, section: str, message: str) -> None:
        self.findings.append(Finding("FAIL", section, message))

    def has_failures(self) -> bool:
        return any(finding.level == "FAIL" for finding in self.findings)

    def print_report(self, session: str | None, skill: str | None) -> None:
        title = "STATIC REVIEW REPORT"
        if session or skill:
            title += f" - Session {session or '?'} - {skill or '?'}"
        print(title)
        print()
        for level in ("FAIL", "WARN", "PASS"):
            items = [finding for finding in self.findings if finding.level == level]
            print(f"{level} ({len(items)})")
            if not items:
                print("- None.")
            for item in items:
                print(f"- {item.section}: {item.message}")
            print()


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def production_paths() -> list[Path]:
    paths: list[Path] = []
    for item in PRODUCTION_FILES:
        path = ROOT / item
        if path.exists():
            paths.append(path)
    for dirname in PRODUCTION_DIRS:
        base = ROOT / dirname
        if base.exists():
            paths.extend(sorted(base.glob("*.js")))
    return paths


def run_command(args: list[str]) -> tuple[int, str]:
    completed = subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    output = (completed.stdout + completed.stderr).strip()
    return completed.returncode, output


def line_hits(path: Path, pattern: str, flags: int = 0) -> list[str]:
    hits: list[str] = []
    regex = re.compile(pattern, flags)
    for index, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        if regex.search(line):
            hits.append(f"{rel(path)}:{index}")
    return hits


def strip_js_comments(text: str) -> str:
    """Removes JavaScript comments while preserving code text enough for scans."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return re.sub(r"//.*", "", text)


def check_git(review: Review) -> None:
    code, branch = run_command(["git", "branch", "--show-current"])
    if code == 0 and branch:
        if branch.strip() == "main":
            review.fail("Git", "current branch is main; sessions must work on dev")
        else:
            review.pass_("Git", f"current branch is {branch.strip()}")
    else:
        review.warn("Git", "could not determine current branch")

    code, status = run_command(["git", "status", "--short"])
    if code != 0:
        review.warn("Git", "could not read git status")
        return

    if "config.js" in status:
        review.fail("Git", "config.js appears in git status")
    else:
        review.pass_("Git", "config.js is not in git status")

    if "node_modules" in status:
        review.fail("Git", "node_modules appears in git status")
    else:
        review.pass_("Git", "node_modules is not in git status")

    if status.strip():
        review.warn("Git", "working tree has changes; verify they are session-scoped")
    else:
        review.pass_("Git", "working tree is clean")

    code, diff_check = run_command(["git", "diff", "--check"])
    if code == 0:
        review.pass_("Git", "git diff --check passed")
    else:
        review.fail("Git", f"git diff --check failed: {diff_check}")


def check_security_files(review: Review) -> None:
    gitignore = read(".gitignore")
    if re.search(r"(^|/|\\)config\.js$", gitignore, re.MULTILINE):
        review.pass_("Security", "config.js is listed in .gitignore")
    else:
        review.fail("Security", "config.js is not listed in .gitignore")

    example = read("config.example.js")
    if "export " in example:
        review.fail("Security", "config.example.js uses export syntax")
    else:
        review.pass_("Security", "config.example.js uses non-module syntax")

    if re.search(r"AIza[0-9A-Za-z_-]{20,}", example):
        review.fail("Security", "config.example.js appears to contain a real Firebase API key")
    else:
        review.pass_("Security", "config.example.js does not contain an obvious real API key")


def check_html(review: Review) -> None:
    path = ROOT / "index.html"
    html = read("index.html")
    if not html:
        review.fail("HTML", "index.html is missing")
        return

    inline_hits = line_hits(path, r"\sstyle=")
    handler_hits = line_hits(path, r"\son[a-z]+=")
    if inline_hits:
        review.fail("HTML", f"inline styles found at {', '.join(inline_hits[:8])}")
    else:
        review.pass_("HTML", "no inline styles found")
    if handler_hits:
        review.fail("HTML", f"inline JS handlers found at {', '.join(handler_hits[:8])}")
    else:
        review.pass_("HTML", "no inline JS handlers found")

    scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
    app_scripts = [script for script in scripts if script.startswith("js/")]
    if app_scripts == CANONICAL_SCRIPT_ORDER:
        review.pass_("HTML", "application script order is canonical")
    else:
        review.fail("HTML", f"application script order is {app_scripts}")

    firebase_scripts = [script for script in scripts if "firebasejs" in script]
    firebase_names = [script.rsplit("/", 1)[-1] for script in firebase_scripts]
    if firebase_names == FIREBASE_CDN_ORDER:
        review.pass_("HTML", "Firebase compat SDK order is canonical")
    else:
        review.fail("HTML", f"Firebase compat SDK order is {firebase_names}")

    for required_id in ("view-login", "view-app", "search-input", "notification-bell", "notif-count", "task-list", "sidebar-project-list", "view-dashboard", "view-project", "view-settings", "fab-add-task", "offline-banner"):
        if f'id="{required_id}"' in html:
            review.pass_("HTML", f"#{required_id} exists")
        else:
            review.fail("HTML", f"#{required_id} is missing")

    if 'data-view="settings"' in html:
        review.pass_("HTML", "settings navigation trigger exists")
    else:
        review.fail("HTML", 'visible settings navigation trigger with data-view="settings" is missing')

    if 'id="notification-count"' in html:
        review.fail("HTML", "legacy #notification-count ID is present")
    else:
        review.pass_("HTML", "legacy #notification-count ID is absent")


def check_css(review: Review) -> None:
    path = ROOT / "style.css"
    css = read("style.css")
    if not css:
        review.fail("CSS", "style.css is missing")
        return

    for token in ("--color-sidebar", "--color-bg", "--color-card", "--color-border", "--color-accent", "--color-accent-hover", "--color-text-primary", "--color-text-muted", "--color-notif-badge"):
        if token in css:
            review.pass_("CSS", f"{token} exists")
        else:
            review.fail("CSS", f"{token} missing")

    root_match = re.search(r":root\s*\{(?P<body>.*?)\}", css, re.DOTALL)
    root_start, root_end = (root_match.span("body") if root_match else (0, 0))
    hex_hits: list[str] = []
    for match in re.finditer(r"#[0-9a-fA-F]{3,8}\b", css):
        if not (root_start <= match.start() <= root_end):
            line = css[: match.start()].count("\n") + 1
            hex_hits.append(f"style.css:{line}")
    if hex_hits:
        review.fail("CSS", f"hardcoded hex outside :root at {', '.join(hex_hits[:12])}")
    else:
        review.pass_("CSS", "no hardcoded hex outside :root")

    important_hits = line_hits(path, r"!important")
    if important_hits:
        review.warn("CSS", f"!important found at {', '.join(important_hits[:8])}")
    else:
        review.pass_("CSS", "no !important declarations")

    risky_animation_hits = line_hits(path, r"transition\s*:[^;]*(width|height|top|left)|@keyframes[\s\S]*(width|height|top|left)")
    if risky_animation_hits:
        review.warn("CSS", f"possible non-transform/opacity animation at {', '.join(risky_animation_hits[:8])}")
    else:
        review.pass_("CSS", "no obvious width/height/top/left animation")


def check_js_syntax(review: Review) -> None:
    for name in JS_FILES:
        path = ROOT / "js" / name
        if not path.exists():
            review.fail("JavaScript", f"js/{name} is missing")
            continue
        code, output = run_command(["node", "--check", str(path)])
        if code == 0:
            review.pass_("JavaScript", f"node --check js/{name} passed")
        else:
            review.fail("JavaScript", f"node --check js/{name} failed: {output}")


def check_js_rules(review: Review) -> None:
    js_paths = sorted((ROOT / "js").glob("*.js"))
    all_js = "\n".join(path.read_text(encoding="utf-8", errors="replace") for path in js_paths)

    patterns = [
        ("JavaScript", r"\bvar\s+", "var usage"),
        ("JavaScript", r"console\.log\s*\(", "console.log usage"),
        ("JavaScript", r"\beval\s*\(", "eval usage"),
        ("JavaScript", r"createElement\s*\(\s*['\"]script['\"]", "dynamic script creation"),
        ("JavaScript", r"\.innerHTML\s*=", "innerHTML assignment"),
        ("Firebase", r"import\s+.*from\s+['\"]firebase", "Firebase modular import"),
    ]
    for section, pattern, label in patterns:
        hits: list[str] = []
        for path in js_paths:
            hits.extend(line_hits(path, pattern))
        if hits:
            review.fail(section, f"{label} found at {', '.join(hits[:12])}")
        else:
            review.pass_(section, f"no {label}")

    for path in js_paths:
        check_jsdoc_for_file(review, path)

    if "db_firestore.enablePersistence({ synchronizeTabs: false })" in read("js/config.js"):
        review.pass_("Firebase", "Firestore persistence uses compat synchronizeTabs false")
    else:
        review.fail("Firebase", "Firestore persistence call is missing or not canonical")


def check_jsdoc_for_file(review: Review, path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    missing: list[str] = []
    function_pattern = re.compile(r"^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", re.MULTILINE)
    for match in function_pattern.finditer(text):
        line_number = text[: match.start()].count("\n") + 1
        previous = line_number - 2
        while previous >= 0 and not lines[previous].strip():
            previous -= 1
        if previous < 0 or lines[previous].strip() != "*/":
            missing.append(f"{rel(path)}:{line_number}:{match.group(1)}")
    if missing:
        review.fail("JSDoc", f"missing JSDoc before functions: {', '.join(missing[:12])}")
    else:
        review.pass_("JSDoc", f"{rel(path)} functions have JSDoc")


def check_module_boundaries(review: Review) -> None:
    app = strip_js_comments(read("js/app.js"))
    ui = strip_js_comments(read("js/ui.js"))
    db = strip_js_comments(read("js/db.js"))
    auth = strip_js_comments(read("js/auth.js"))
    router = strip_js_comments(read("js/router.js"))

    if re.search(r"\bfirebase\.", app):
        review.fail("Module boundary", "app.js calls Firebase directly")
    else:
        review.pass_("Module boundary", "app.js has no direct Firebase calls")

    if "renderSidebarUser" in ui and "ui.renderSidebarUser" in app:
        review.pass_("Module boundary", "app.js delegates sidebar user rendering to ui.js")
    elif "renderSidebarUser" in ui:
        review.fail("Module boundary", "renderSidebarUser exists but app.js does not use it")

    for helper in ("renderTaskModalValidation", "clearTaskModalValidation", "renderProjectModalValidation", "clearProjectModalValidation"):
        if helper in ui and f"ui.{helper}" in app:
            review.pass_("Module boundary", f"app.js uses ui.{helper}")
        elif helper in ui:
            review.fail("Module boundary", f"{helper} exists but app.js does not use it")

    if re.search(r"\bfirebase\.|\bdb\.", ui):
        review.fail("Module boundary", "ui.js references Firebase or db")
    else:
        review.pass_("Module boundary", "ui.js has no Firebase/db references")

    if re.search(r"\bstate\s*\.|const\s+state\s*=", ui):
        review.fail("Module boundary", "ui.js appears to manage app state")
    else:
        review.pass_("Module boundary", "ui.js does not manage app state")

    if re.search(r"\bdocument\.|querySelector|getElementById|ui\.", db):
        review.fail("Module boundary", "db.js references DOM or ui")
    else:
        review.pass_("Module boundary", "db.js has no DOM/ui references")

    if re.search(r"\bdocument\.|querySelector|getElementById", auth):
        review.fail("Module boundary", "auth.js references DOM")
    else:
        review.pass_("Module boundary", "auth.js has no DOM references")

    if re.search(r"\bstate\s*\.", auth + router + db + ui):
        review.fail("Module boundary", "non-app module references state")
    else:
        review.pass_("Module boundary", "only app.js owns state references")


def check_app_contracts(review: Review) -> None:
    app = read("js/app.js")
    if not app:
        review.fail("App", "js/app.js is missing")
        return

    state_match = re.search(r"const\s+state\s*=\s*\{(?P<body>.*?)\n\};", app, re.DOTALL)
    if not state_match:
        review.fail("App", "canonical state object not found")
    else:
        body = state_match.group("body")
        for key in REQUIRED_STATE_KEYS:
            if re.search(rf"\b{re.escape(key)}\s*:", body):
                review.pass_("App", f"state.{key} exists")
            else:
                review.fail("App", f"state.{key} missing")

    if "state.listeners.push" in app:
        review.pass_("App", "listeners are pushed to state.listeners")
    else:
        review.fail("App", "no state.listeners.push usage found")

    if re.search(r"state\.listeners\.forEach\([^)]*unsubscribe|forEach\([^)]*safeUnsubscribe", app, re.DOTALL) and "state.listeners = []" in app:
        review.pass_("App", "listener cleanup clears state.listeners")
    else:
        review.fail("App", "listener cleanup pattern is missing")

    if "Unable to load data. Please try again." in app and re.search(r"resubscribeDashboardTasks|startDashboardListener", app):
        review.pass_("App", "dashboard transient error resubscribe path exists")
    else:
        review.fail("App", "dashboard transient error resubscribe path missing")

    if "window.app" in app and all(name in app for name in ("init", "handleSearch", "handleFilter", "handleProjectSwitch", "handleSignOut")):
        review.pass_("App", "window.app exposes required public API")
    else:
        review.fail("App", "window.app required public API is incomplete")


def check_db_contracts(review: Review) -> None:
    db = read("js/db.js")
    if not db:
        review.fail("DB", "js/db.js is missing")
        return

    if "collectionGroup('tasks')" in db or 'collectionGroup("tasks")' in db:
        if ".where('userId', '=='" in db or '.where("userId", "=="' in db:
            review.pass_("DB", "dashboard collection group filters by userId")
        else:
            review.fail("DB", "dashboard collection group does not filter by userId")
    else:
        review.fail("DB", "dashboard collection group query missing")

    create_task_match = re.search(r"async\s+function\s+createTask(?P<body>.*?)\n\}", db, re.DOTALL)
    if create_task_match and "userId" in create_task_match.group("body"):
        review.pass_("DB", "createTask write path includes userId")
    else:
        review.fail("DB", "createTask write path does not include userId")

    for name in ("createProject", "listenToProjects", "updateProject", "deleteProject", "createTask", "listenToTasks", "listenToDashboardTasks", "updateTask", "deleteTask", "writeActivityLog", "saveUserProfile", "saveFcmToken"):
        if re.search(rf"\b{name}\b", db):
            review.pass_("DB", f"{name} exists")
        else:
            review.fail("DB", f"{name} missing")


def check_contract_drift(review: Review) -> None:
    for term in STALE_TERMS:
        hits: list[str] = []
        for path in production_paths():
            hits.extend(line_hits(path, re.escape(term)))
        if hits:
            review.fail("Contract drift", f"stale term {term!r} found at {', '.join(hits[:12])}")
        else:
            review.pass_("Contract drift", f"stale term {term!r} absent from production code")

    ui = read("js/ui.js")
    settings_copy = "Notifications disabled. You can enable them in browser settings."
    app = read("js/app.js")
    if settings_copy in app or settings_copy in ui:
        review.pass_("Contract drift", "notification denied copy is canonical")
    else:
        review.fail("Contract drift", "canonical notification denied copy missing")

    if re.search(r"enable notifications|notification toggle", ui, re.IGNORECASE):
        review.warn("Contract drift", "settings copy may imply unavailable enable-notifications behavior")
    else:
        review.pass_("Contract drift", "settings copy does not obviously promise notification enable toggle")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run read-only static QA for Taskly.")
    parser.add_argument("--session", help="Session number for report context")
    parser.add_argument("--skill", help="Skill name for report context")
    args = parser.parse_args()

    review = Review()
    check_git(review)
    check_security_files(review)
    check_html(review)
    check_css(review)
    check_js_syntax(review)
    check_js_rules(review)
    check_module_boundaries(review)
    check_app_contracts(review)
    check_db_contracts(review)
    check_contract_drift(review)
    review.print_report(args.session, args.skill)
    return 1 if review.has_failures() else 0


if __name__ == "__main__":
    sys.exit(main())
