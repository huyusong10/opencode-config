import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"

const repo = path.resolve(import.meta.dirname, "..")
const cli = path.join(repo, "bin", "agentcfg")

function env(root: string, overrides: Record<string, string> = {}) {
    return {
        ...process.env,
        HOME: root,
        AGENTCFG_STATE_HOME: path.join(root, ".agentcfg"),
        AGENTCFG_REPO_ROOT: repo,
        ...overrides,
    }
}

function run(args: string[], root = mkdtempSync(path.join(tmpdir(), "agentcfg-")), overrides: Record<string, string> = {}) {
    const res = spawnSync(cli, args, {
        cwd: repo,
        env: env(root, overrides),
        encoding: "utf8",
    })
    return { ...res, root }
}

function runGit(args: string[], cwd: string) {
    const res = spawnSync("git", args, {
        cwd,
        encoding: "utf8",
    })
    assert.equal(res.status, 0, res.stderr)
    return res
}

function repoWithWritableInstructions(root: string) {
    const tempRepo = path.join(root, "repo")
    mkdirSync(path.join(tempRepo, "assets"), { recursive: true })
    mkdirSync(path.join(tempRepo, "instructions", "shared"), { recursive: true })
    mkdirSync(path.join(tempRepo, "instructions", "codex"), { recursive: true })

    for (const dir of ["profiles", "targets", "templates"]) {
        symlinkSync(path.join(repo, dir), path.join(tempRepo, dir), "dir")
    }
    for (const dir of ["agents", "commands", "config", "plugins", "rules", "scripts", "skills"]) {
        symlinkSync(path.join(repo, "assets", dir), path.join(tempRepo, "assets", dir), "dir")
    }
    copyFileSync(path.join(repo, "AGENTS.md"), path.join(tempRepo, "AGENTS.md"))
    copyFileSync(path.join(repo, "instructions", "shared", "core.md"), path.join(tempRepo, "instructions", "shared", "core.md"))
    copyFileSync(path.join(repo, "instructions", "codex", "main.md"), path.join(tempRepo, "instructions", "codex", "main.md"))

    return tempRepo
}

test("validate checks repository contracts", () => {
    const res = run(["validate"])
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /validate ok/)
})

test("rendered codex instructions stay in sync with AGENTS.md", () => {
    const res = run(["render", "codex"])
    assert.equal(res.status, 0, res.stderr)
    assert.equal(res.stdout, readFileSync(path.join(repo, "AGENTS.md"), "utf8"))
})

test("codex-only instruction fragment renders only for codex", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const tempRepo = repoWithWritableInstructions(root)
    const marker = "codex-only-render-marker"
    writeFileSync(path.join(tempRepo, "instructions", "shared", "core.md"), "shared instructions\n")
    writeFileSync(path.join(tempRepo, "instructions", "codex", "main.md"), `${marker}\n`)

    const codex = run(["render", "codex"], root, { AGENTCFG_REPO_ROOT: tempRepo })
    const claude = run(["render", "claude"], root, { AGENTCFG_REPO_ROOT: tempRepo })
    const opencode = run(["render", "opencode"], root, { AGENTCFG_REPO_ROOT: tempRepo })

    assert.equal(codex.status, 0, codex.stderr)
    assert.equal(claude.status, 0, claude.stderr)
    assert.equal(opencode.status, 0, opencode.stderr)
    assert.match(codex.stdout, new RegExp(marker))
    assert.doesNotMatch(claude.stdout, new RegExp(marker))
    assert.doesNotMatch(opencode.stdout, new RegExp(marker))
})

test("validate rejects oversized instruction fragments", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const tempRepo = repoWithWritableInstructions(root)
    const oversized = Array.from({ length: 301 }, (_, index) => `line ${index + 1}`).join("\n") + "\n"
    writeFileSync(path.join(tempRepo, "instructions", "shared", "core.md"), oversized)

    const res = run(["validate"], root, { AGENTCFG_REPO_ROOT: tempRepo })
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /(codex|claude|opencode) instruction fragment 行数 301 超过预算 300/)
})

test("install writes shared and target instruction fragments without caring about section names", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const tempRepo = repoWithWritableInstructions(root)
    const manualInstructions = [
        "# My Manual Rules",
        "",
        "This content intentionally avoids repository-specific section names.",
        "Manual edits should not require test updates.",
        "",
    ].join("\n")
    const codexOnlyInstructions = [
        "# Target Only",
        "",
        "Codex can carry a target-specific rule without leaking it to other tools.",
        "",
    ].join("\n")
    writeFileSync(path.join(tempRepo, "instructions", "shared", "core.md"), manualInstructions)
    writeFileSync(path.join(tempRepo, "instructions", "codex", "main.md"), codexOnlyInstructions)
    writeFileSync(path.join(tempRepo, "AGENTS.md"), manualInstructions)

    const res = run(["install", "all", "--profile", "full"], root, { AGENTCFG_REPO_ROOT: tempRepo })
    assert.equal(res.status, 0, res.stderr)
    assert.equal(readFileSync(path.join(root, ".codex", "AGENTS.md"), "utf8"), manualInstructions.trimEnd() + "\n\n" + codexOnlyInstructions)
    assert.equal(readFileSync(path.join(root, ".claude", "CLAUDE.md"), "utf8"), manualInstructions)
    assert.equal(readFileSync(path.join(root, ".config", "opencode", "AGENTS.md"), "utf8"), manualInstructions)
})

test("install dry-run does not write manifest or target files", () => {
    const res = run(["install", "codex", "--profile", "minimal", "--dry-run"])
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /\[dry-run\] install codex:instructions/)
    assert.equal(existsSync(path.join(res.root, ".agentcfg", "manifest.json")), false)
    assert.equal(existsSync(path.join(res.root, ".codex", "AGENTS.md")), false)
})

test("full dry-run includes OpenCode regression assets", () => {
    const res = run(["install", "opencode", "--profile", "opencode-full", "--dry-run"])
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /opencode:opencode-config/)
    assert.match(res.stdout, /opencode:opencode-agents/)
    assert.match(res.stdout, /opencode:opencode-commands/)
    assert.match(res.stdout, /opencode:opencode-plugins/)
})

test("profile target whitelist rejects explicit mismatches", () => {
    const res = run(["install", "codex", "--profile", "opencode-full", "--dry-run"])
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /profile opencode-full 不支持 target：codex/)
})

test("install writes manifest and backs up pre-existing non-managed files", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const agents = path.join(root, ".codex", "AGENTS.md")
    mkdirSync(path.dirname(agents), { recursive: true })
    writeFileSync(agents, "local custom file\n", { flag: "w" })

    const res = run(["install", "codex", "--profile", "minimal"], root)
    assert.equal(res.status, 0, res.stderr)

    const manifest = JSON.parse(readFileSync(path.join(root, ".agentcfg", "manifest.json"), "utf8"))
    assert.equal(manifest.entries.some((entry: any) => entry.target === "codex" && entry.asset === "instructions"), true)
    assert.notEqual(readFileSync(agents, "utf8"), "local custom file\n")
    assert.equal(readFileSync(agents, "utf8").length > 0, true)
    assert.equal(manifest.entries.some((entry: any) => entry.backup), true)
})

test("install replaces broken instruction symlink", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const agents = path.join(root, ".config", "opencode", "AGENTS.md")
    mkdirSync(path.dirname(agents), { recursive: true })
    symlinkSync(path.join(root, "missing", "AGENTS.md"), agents)

    const res = run(["install", "opencode", "--profile", "minimal"], root)
    assert.equal(res.status, 0, res.stderr)
    assert.equal(lstatSync(agents).isSymbolicLink(), false)
    assert.equal(readFileSync(agents, "utf8").length > 0, true)

    const manifest = JSON.parse(readFileSync(path.join(root, ".agentcfg", "manifest.json"), "utf8"))
    const entry = manifest.entries.find((item: any) => item.target === "opencode" && item.asset === "instructions")
    assert.equal(Boolean(entry.backup), true)
})

test("install does not exclude legitimate asset names containing log substrings", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const res = run(["install", "opencode", "--profile", "opencode-full"], root)
    assert.equal(res.status, 0, res.stderr)
    assert.equal(existsSync(path.join(root, ".config", "opencode", "plugin", "delegation-logger.ts")), true)
    assert.equal(existsSync(path.join(root, ".config", "opencode", "skills", "webapp-testing", "examples", "console_logging.py")), true)
})

test("uninstall only removes managed entries", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const keep = path.join(root, ".codex", "keep.md")
    mkdirSync(path.dirname(keep), { recursive: true })

    const install = run(["install", "codex", "--profile", "minimal"], root)
    assert.equal(install.status, 0, install.stderr)
    writeFileSync(keep, "not managed\n")

    const uninstall = run(["uninstall", "codex"], root)
    assert.equal(uninstall.status, 0, uninstall.stderr)
    assert.equal(existsSync(path.join(root, ".codex", "AGENTS.md")), false)
    assert.equal(existsSync(keep), true)
})

test("restore brings back files and matching manifest entries", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const install = run(["install", "codex", "--profile", "minimal"], root)
    assert.equal(install.status, 0, install.stderr)

    const backup = run(["backup", "codex"], root)
    assert.equal(backup.status, 0, backup.stderr)
    const uninstall = run(["uninstall", "codex"], root)
    assert.equal(uninstall.status, 0, uninstall.stderr)

    const restore = run(["restore", "latest"], root)
    assert.equal(restore.status, 0, restore.stderr)
    const status = run(["status"], root)
    assert.equal(status.status, 0, status.stderr)
    assert.match(status.stdout, /ok\s+codex:instructions/)
    assert.match(status.stdout, /ok\s+codex:shared-skills/)
})

test("backup filters target contents without treating home path segments as excluded", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const root = path.join(parent, "projects")
    mkdirSync(root, { recursive: true })

    const install = run(["install", "codex", "--profile", "minimal"], root)
    assert.equal(install.status, 0, install.stderr)
    const backup = run(["backup", "codex"], root)
    assert.equal(backup.status, 0, backup.stderr)

    const id = backup.stdout.match(/备份完成：(\S+)/)?.[1]
    assert.ok(id)
    const index = JSON.parse(readFileSync(path.join(root, ".agentcfg", "backups", id, "index.json"), "utf8"))
    assert.equal(index.entries.length, 2)
    assert.equal(index.entries.some((entry: any) => entry.destination.endsWith(path.join(".codex", "AGENTS.md"))), true)
    assert.equal(index.entries.some((entry: any) => entry.destination.endsWith(path.join(".agents", "skills"))), true)
})

test("import plan filters target-relative ignored files only", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const root = path.join(parent, "projects")
    const codexRoot = path.join(root, ".codex")
    mkdirSync(codexRoot, { recursive: true })
    writeFileSync(path.join(codexRoot, "local.md"), "local config\n")
    writeFileSync(path.join(codexRoot, "token.txt"), "not a real token\n")

    const res = run(["import", "codex", "--plan"], root)
    assert.equal(res.status, 0, res.stderr)
    const plan = JSON.parse(res.stdout)
    const paths = plan.candidates.map((candidate: any) => candidate.path)
    assert.equal(paths.some((item: string) => item.endsWith(path.join(".codex", "local.md"))), true)
    assert.equal(paths.some((item: string) => item.endsWith(path.join(".codex", "token.txt"))), false)
})

test("link mode diff follows symlinked directory contents", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const install = run(["install", "codex", "--profile", "minimal", "--link"], root)
    assert.equal(install.status, 0, install.stderr)

    const diff = run(["diff", "codex", "--profile", "minimal"], root)
    assert.equal(diff.status, 0, diff.stderr)
    assert.match(diff.stdout, /same\s+codex:instructions/)
    assert.match(diff.stdout, /same\s+codex:shared-skills/)
    assert.doesNotMatch(diff.stdout, /diff\s+codex:shared-skills/)
})

test("doctor detects sensitive files even though managed scans exclude them", () => {
    const home = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const tempRepo = path.join(home, "repo")
    mkdirSync(tempRepo, { recursive: true })
    for (const dir of ["assets", "profiles", "targets", "templates", "instructions"]) {
        symlinkSync(path.join(repo, dir), path.join(tempRepo, dir), "dir")
    }
    symlinkSync(path.join(repo, "AGENTS.md"), path.join(tempRepo, "AGENTS.md"))
    writeFileSync(path.join(tempRepo, "token.txt"), "not a real token\n")

    const res = run(["doctor"], home, { AGENTCFG_REPO_ROOT: tempRepo })
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /suspicious files:/)
    assert.match(res.stdout, /token\.txt/)
})

test("doctor checks sensitive names relative to the repository", () => {
    const home = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const parent = path.join(home, "token-work")
    mkdirSync(parent, { recursive: true })
    const tempRepo = repoWithWritableInstructions(parent)

    const res = run(["doctor"], home, { AGENTCFG_REPO_ROOT: tempRepo })
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /suspicious files: none/)
})

test("save refuses to stage default excluded files", () => {
    const root = mkdtempSync(path.join(tmpdir(), "agentcfg-"))
    const tempRepo = repoWithWritableInstructions(root)
    runGit(["init"], tempRepo)
    writeFileSync(path.join(tempRepo, "token.txt"), "not a real token\n")

    const res = run(["save", "checkpoint"], root, { AGENTCFG_REPO_ROOT: tempRepo })
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /拒绝保存默认排除内容/)
    assert.match(res.stderr, /token\.txt/)

    const staged = runGit(["diff", "--cached", "--name-only"], tempRepo)
    assert.equal(staged.stdout, "")
})

test("rollback without --apply is a read-only plan", () => {
    const res = run(["rollback", "HEAD"])
    assert.equal(res.status, 0, res.stderr)
    assert.match(res.stdout, /未执行回滚/)
})

test("rollback reports invalid refs as failures", () => {
    const res = run(["rollback", "not-a-real-ref"])
    assert.notEqual(res.status, 0)
    assert.match(res.stderr, /not-a-real-ref/)
})
