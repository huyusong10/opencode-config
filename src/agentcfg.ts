import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync, copyFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

type AnyRecord = Record<string, any>

type Target = {
    name: string
    instruction?: {
        destination: string
        fragments?: string[]
        maxLines?: number
    }
    placements?: Placement[]
}

type Placement = {
    id: string
    source: string
    destination: string
    kind: "file" | "directory"
}

type Profile = {
    name: string
    targets: string[]
    assets: string[]
    filters?: Record<string, { include?: string[] }>
}

type Manifest = {
    version: number
    repo: string
    updatedAt: string
    entries: ManifestEntry[]
}

type ManifestEntry = {
    target: string
    asset: string
    source: string
    destination: string
    kind: "file" | "directory"
    mode: "copy" | "link"
    checksum: string
    installedAt: string
    generated: boolean
    backup?: string
}

type Options = {
    dryRun: boolean
    apply: boolean
    mode: "copy" | "link"
    profile: string
    plan: boolean
}

type InstallStep = {
    target: string
    asset: string
    source: string
    destination: string
    kind: "file" | "directory"
    generated: boolean
    content?: string
    filter?: { include?: string[] }
}

const repo = process.env.AGENTCFG_REPO_ROOT
    ? path.resolve(process.env.AGENTCFG_REPO_ROOT)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const stateRoot = expandHome(process.env.AGENTCFG_STATE_HOME || "~/.agentcfg")
const manifestPath = path.join(stateRoot, "manifest.json")
const traversalIgnoredNames = [
    /^\.git$/i,
    /^node_modules$/i,
    /^ref$/i,
]
const managedIgnoredNames = [
    /^\.DS_Store$/i,
    /^__pycache__$/i,
    /^.*\.pyc$/i,
    /^\.env(?:$|\.)/i,
    /auth\.json$/i,
    /(^|[-_.])(token|secret)([-_.]|$)/i,
    /(^|[-_.])(api[-_.]?key|private[-_.]?key|ssh[-_.]?key)([-_.]|$)/i,
    /^key\.(json|txt|pem|key|env)$/i,
    /^history(?:\..*)?$/i,
    /^transcripts?(?:\..*)?$/i,
    /^sessions?(?:\..*)?$/i,
    /^todos?(?:\..*)?$/i,
    /^plans?(?:\..*)?$/i,
    /^projects?$/i,
    /^cache$/i,
    /^logs?$/i,
    /^.*\.log$/i,
    /^.*\.sqlite$/i,
    /^.*\.db$/i,
    /^database$/i,
    /^.*\.lock$/i,
    /^bun\.lockb?$/i,
    /^package-lock\.json$/i,
]
const sensitiveNames = [
    /^\.env(?:$|\.)/i,
    /auth\.json$/i,
    /(^|[-_.])(token|secret)([-_.]|$)/i,
    /(^|[-_.])(api[-_.]?key|private[-_.]?key|ssh[-_.]?key)([-_.]|$)/i,
    /^key\.(json|txt|pem|key|env)$/i,
]
const instructionLineBudgets = {
    fragment: 300,
    rendered: 300,
}
const sourceOnlyInstructionReferences = [
    /assets\//,
    /rules\/shared/,
    /scripts\/align_ascii\.py/,
]

function main(argv = process.argv.slice(2)) {
    try {
        const cmd = argv[0] || "help"
        const args = argv.slice(1)
        const opts = parseOptions(args)

        if (cmd === "help" || cmd === "--help" || cmd === "-h") return help()
        if (cmd === "validate") return validateCommand()
        if (cmd === "render") return renderCommand(firstArg(args) || "all")
        if (cmd === "install") return installCommand(firstArg(args) || "all", opts)
        if (cmd === "uninstall") return uninstallCommand(firstArg(args) || "all", opts)
        if (cmd === "status") return statusCommand()
        if (cmd === "diff") return diffCommand(firstArg(args) || "all", opts)
        if (cmd === "doctor") return doctorCommand()
        if (cmd === "backup") return backupCommand(firstArg(args) || "all", opts)
        if (cmd === "restore") return restoreCommand(firstArg(args) || "latest", opts)
        if (cmd === "import") return importCommand(firstArg(args) || "all", opts)
        if (cmd === "save") return saveCommand(args.filter((arg) => !arg.startsWith("--")).join(" "))
        if (cmd === "sync") return syncCommand()
        if (cmd === "publish") return publishCommand(args.filter((arg) => !arg.startsWith("--")).join(" "))
        if (cmd === "history") return historyCommand()
        if (cmd === "rollback") return rollbackCommand(firstArg(args), opts)

        throw new Error(`未知命令：${cmd}`)
    } catch (err) {
        console.error(`agentcfg: ${err instanceof Error ? err.message : String(err)}`)
        process.exitCode = 1
    }
}

function help() {
    console.log(`agentcfg - Coding Agent 配置管理器

Usage:
    agentcfg install <codex|claude|opencode|all> --profile full [--copy|--link] [--dry-run]
    agentcfg uninstall <codex|claude|opencode|all> [--dry-run]
    agentcfg status
    agentcfg diff <codex|claude|opencode|all>
    agentcfg doctor
    agentcfg backup <codex|claude|opencode|all>
    agentcfg restore <backup-id|latest>
    agentcfg import <codex|claude|opencode|all> --plan
    agentcfg render <codex|claude|opencode|all>
    agentcfg validate
    agentcfg save "message"
    agentcfg sync
    agentcfg publish "message"
    agentcfg history
    agentcfg rollback <ref> [--apply]
`)
}

function parseOptions(args: string[]): Options {
    const opts: Options = {
        dryRun: args.includes("--dry-run"),
        apply: args.includes("--apply"),
        mode: args.includes("--link") ? "link" : "copy",
        profile: valueAfter(args, "--profile") || "full",
        plan: args.includes("--plan"),
    }

    if (args.includes("--copy")) opts.mode = "copy"
    return opts
}

function firstArg(args: string[]) {
    return args.find((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--profile")
}

function valueAfter(args: string[], flag: string) {
    const index = args.indexOf(flag)
    if (index < 0) return undefined
    return args[index + 1]
}

function loadTargets() {
    const dir = path.join(repo, "targets")
    return readdirSync(dir)
        .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
        .map((file) => parseYamlFile(path.join(dir, file)) as Target)
}

function loadTarget(name: string) {
    const target = loadTargets().find((item) => item.name === name)
    if (!target) throw new Error(`找不到 target：${name}`)
    return target
}

function loadProfile(name: string) {
    const file = path.join(repo, "profiles", `${name}.yaml`)
    if (!existsSync(file)) throw new Error(`找不到 profile：${name}`)
    return parseYamlFile(file) as Profile
}

function expandTarget(spec: string, profile?: Profile) {
    const names = loadTargets().map((target) => target.name)
    if (spec === "all") {
        if (!profile) return names
        return names.filter((name) => profile.targets.includes(name))
    }
    if (!names.includes(spec)) throw new Error(`未知 target：${spec}`)
    if (profile && !profile.targets.includes(spec)) throw new Error(`profile ${profile.name} 不支持 target：${spec}`)
    return [spec]
}

function selected(profile: Profile, id: string) {
    return profile.assets.includes(id)
}

function buildInstallSteps(spec: string, opts: Options) {
    const profile = loadProfile(opts.profile)
    const names = expandTarget(spec, profile)
    const steps: InstallStep[] = []

    for (const name of names) {
        const target = loadTarget(name)
        if (target.instruction && selected(profile, "instructions")) {
            steps.push({
                target: name,
                asset: "instructions",
                source: instructionSource(target),
                destination: target.instruction.destination,
                kind: "file",
                generated: true,
                content: renderInstructions(target),
            })
        }

        for (const place of target.placements || []) {
            if (!selected(profile, place.id)) continue
            steps.push({
                target: name,
                asset: place.id,
                source: place.source,
                destination: place.destination,
                kind: place.kind,
                generated: false,
                filter: profile.filters?.[place.id],
            })
        }
    }

    return steps
}

function renderInstructions(target: Target) {
    if (!target.instruction) throw new Error(`target ${target.name} 未声明 instruction`)
    const tpl = readText(path.join(repo, "templates", "instructions.md"))
    const instructions = instructionSourceText(target)

    return tpl
        .replace("{{instructions}}", instructions)
        .trimEnd() + "\n"
}

function instructionSource(target: Target) {
    if (!target.instruction) throw new Error(`target ${target.name} 未声明 instruction`)
    return `targets/${target.name}.yaml`
}

function instructionSourceText(target: Target) {
    if (!target.instruction) throw new Error(`target ${target.name} 未声明 instruction`)
    return instructionFragments(target)
        .map((fragment) => readText(path.join(repo, fragment)).trim())
        .filter(Boolean)
        .join("\n\n")
}

function instructionFragments(target: Target) {
    if (!target.instruction) throw new Error(`target ${target.name} 未声明 instruction`)
    if (target.instruction.fragments?.length) return target.instruction.fragments
    throw new Error(`target ${target.name} instruction 缺少 fragments`)
}

function renderCommand(spec: string) {
    const names = expandTarget(spec)
    const multi = names.length > 1
    for (const name of names) {
        const target = loadTarget(name)
        if (!target.instruction) continue
        if (multi) console.log(`===== ${name} =====`)
        process.stdout.write(renderInstructions(target))
        if (multi) process.stdout.write("\n")
    }
}

function installCommand(spec: string, opts: Options) {
    validateCommand(true)
    const steps = buildInstallSteps(spec, opts)

    if (opts.dryRun) {
        for (const step of steps) {
            console.log(`[dry-run] install ${step.target}:${step.asset} -> ${expandHome(step.destination)}`)
        }
        return
    }

    const manifest = readManifest()
    const backupId = `install-${stamp()}`
    const entries: ManifestEntry[] = []

    for (const step of steps) {
        const dest = expandHome(step.destination)
        const src = path.join(repo, step.source)
        const backup = pathExists(dest) ? backupPath(backupId, dest) : undefined
        if (backup) copyExisting(dest, backup)

        if (step.generated) {
            installGenerated(step.content || "", dest)
        } else {
            if (!existsSync(src)) throw new Error(`资产不存在：${step.source}`)
            installPath(src, dest, step.kind, opts.mode, step.filter)
        }

        entries.push({
            target: step.target,
            asset: step.asset,
            source: step.source,
            destination: dest,
            kind: step.kind,
            mode: opts.mode,
            checksum: checksumPath(dest),
            installedAt: new Date().toISOString(),
            generated: step.generated,
            backup,
        })
    }

    const destinations = new Set(entries.map((entry) => entry.destination))
    manifest.entries = manifest.entries.filter((entry) => !destinations.has(entry.destination))
    manifest.entries.push(...entries)
    manifest.updatedAt = new Date().toISOString()
    writeManifest(manifest)
    console.log(`安装完成：${entries.length} 项，manifest=${manifestPath}`)
}

function uninstallCommand(spec: string, opts: Options) {
    const manifest = readManifest()
    const names = new Set(expandTarget(spec))
    const entries = manifest.entries.filter((entry) => names.has(entry.target))

    if (opts.dryRun) {
        for (const entry of entries) console.log(`[dry-run] remove ${entry.destination}`)
        return
    }

    const backupId = `uninstall-${stamp()}`
    for (const entry of entries) {
        if (!pathExists(entry.destination)) continue
        if (checksumPath(entry.destination) !== entry.checksum) {
            copyExisting(entry.destination, backupPath(backupId, entry.destination))
        }
        rmSync(entry.destination, { recursive: true, force: true })
    }

    manifest.entries = manifest.entries.filter((entry) => !names.has(entry.target))
    manifest.updatedAt = new Date().toISOString()
    writeManifest(manifest)
    console.log(`卸载完成：${entries.length} 项`)
}

function statusCommand() {
    const manifest = readManifest()
    if (!manifest.entries.length) {
        console.log("未发现 agentcfg 托管条目。")
        return
    }

    for (const entry of manifest.entries) {
        const state = !existsSync(entry.destination)
            ? "missing"
            : checksumPath(entry.destination) === entry.checksum
              ? "ok"
              : "changed"
        console.log(`${state.padEnd(8)} ${entry.target}:${entry.asset} ${entry.destination}`)
    }
}

function diffCommand(spec: string, opts: Options) {
    const steps = buildInstallSteps(spec, opts)
    for (const step of steps) {
        const dest = expandHome(step.destination)
        const expected = step.generated
            ? checksumText(step.content || "")
            : checksumPath(path.join(repo, step.source), step.filter)
        const actual = existsSync(dest) ? checksumPath(dest) : "missing"
        const state = actual === expected ? "same" : actual === "missing" ? "missing" : "diff"
        console.log(`${state.padEnd(8)} ${step.target}:${step.asset} ${dest}`)
    }
}

function doctorCommand() {
    validateCommand(true)
    const manifest = readManifest()
    console.log(`repo: ${repo}`)
    console.log(`state: ${stateRoot}`)
    console.log(`managed entries: ${manifest.entries.length}`)

    const suspicious = scan(repo, { includeManagedIgnored: true })
        .filter((file) => isSensitivePath(path.relative(repo, file)))

    if (suspicious.length) {
        console.log("suspicious files:")
        for (const file of suspicious.slice(0, 20)) console.log(`  ${path.relative(repo, file)}`)
    } else {
        console.log("suspicious files: none")
    }
}

function backupCommand(spec: string, opts: Options) {
    const manifest = readManifest()
    const names = new Set(expandTarget(spec))
    const entries = manifest.entries.filter((entry) => names.has(entry.target) && pathExists(entry.destination))
    const id = `backup-${stamp()}`
    const root = path.join(stateRoot, "backups", id)
    const index = {
        id,
        createdAt: new Date().toISOString(),
        entries: [] as { destination: string; backup: string }[],
    }

    if (opts.dryRun) {
        for (const entry of entries) console.log(`[dry-run] backup ${entry.destination}`)
        return
    }

    for (const entry of entries) {
        if (isManagedIgnoredDestination(entry.destination)) continue
        const backup = backupPath(id, entry.destination)
        copyExisting(entry.destination, backup)
        index.entries.push({ destination: entry.destination, backup })
    }

    mkdirSync(root, { recursive: true })
    writeFileSync(path.join(root, "index.json"), JSON.stringify(index, null, 2) + "\n")
    writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
    console.log(`备份完成：${id}`)
}

function restoreCommand(id: string, opts: Options) {
    const backup = id === "latest" ? latestBackup() : id
    if (!backup) throw new Error("找不到可恢复备份")
    const backupRoot = path.join(stateRoot, "backups", backup)
    const indexFile = path.join(backupRoot, "index.json")
    if (!existsSync(indexFile)) throw new Error(`备份缺少 index：${backup}`)
    const index = JSON.parse(readText(indexFile)) as { entries: { destination: string; backup: string }[] }
    const backedManifestFile = path.join(backupRoot, "manifest.json")
    const backedManifest = existsSync(backedManifestFile)
        ? JSON.parse(readText(backedManifestFile)) as Manifest
        : undefined

    for (const entry of index.entries) {
        if (opts.dryRun) {
            console.log(`[dry-run] restore ${entry.destination}`)
            continue
        }
        if (pathExists(entry.destination)) copyExisting(entry.destination, backupPath(`pre-restore-${stamp()}`, entry.destination))
        rmSync(entry.destination, { recursive: true, force: true })
        mkdirSync(path.dirname(entry.destination), { recursive: true })
        copyExisting(entry.backup, entry.destination)
    }
    if (!opts.dryRun && backedManifest) restoreManifestEntries(backedManifest, index.entries.map((entry) => entry.destination))
    console.log(`恢复完成：${backup}`)
}

function importCommand(spec: string, opts: Options) {
    if (!opts.plan) throw new Error("import 目前只支持 --plan，避免静默写仓库")
    const names = expandTarget(spec)
    const candidates: AnyRecord[] = []

    for (const name of names) {
        const target = loadTarget(name)
        const roots = new Set<string>()
        if (target.instruction) roots.add(path.dirname(expandHome(target.instruction.destination)))
        for (const place of target.placements || []) roots.add(path.dirname(expandHome(place.destination)))

        for (const root of roots) {
            if (!existsSync(root)) continue
            for (const file of scan(root)) {
                if (isManagedIgnoredPath(path.relative(root, file))) continue
                candidates.push({ target: name, path: file, reason: "candidate-config" })
            }
        }
    }

    console.log(JSON.stringify({ candidates }, null, 2))
}

function validateCommand(silent = false) {
    const targets = loadTargets()
    const knownTargets = new Set(targets.map((target) => target.name))
    const knownAssets = new Set(["instructions"])
    for (const target of targets) {
        if (!target.name) throw new Error("target 缺少 name")
        if (target.instruction) {
            for (const fragment of instructionFragments(target)) {
                const file = path.join(repo, fragment)
                if (!existsSync(file)) throw new Error(`target ${target.name} instruction fragment 不存在：${fragment}`)
            }
        }
        for (const place of target.placements || []) {
            if (!place.id || !place.source || !place.destination || !place.kind) {
                throw new Error(`target ${target.name} placement 字段不完整`)
            }
            knownAssets.add(place.id)
            if (!existsSync(path.join(repo, place.source))) throw new Error(`资产不存在：${place.source}`)
        }
    }
    validateInstructionBudgets(targets)

    for (const file of readdirSync(path.join(repo, "profiles")).filter((item) => item.endsWith(".yaml"))) {
        const profile = parseYamlFile(path.join(repo, "profiles", file)) as Profile
        if (!profile.name || !Array.isArray(profile.targets) || !Array.isArray(profile.assets)) {
            throw new Error(`profile 字段不完整：${file}`)
        }
        for (const target of profile.targets) {
            if (!knownTargets.has(target)) throw new Error(`profile ${profile.name} 引用了未知 target：${target}`)
        }
        for (const asset of profile.assets) {
            if (!knownAssets.has(asset)) throw new Error(`profile ${profile.name} 引用了未知资产：${asset}`)
        }
    }

    parseJsonc(readText(path.join(repo, "assets", "config", "opencode", "opencode.jsonc")))
    validateSkills(path.join(repo, "assets", "skills"))
    validateTomlFiles(repo)

    if (!silent) console.log("validate ok")
}

function validateInstructionBudgets(targets: Target[]) {
    for (const target of targets) {
        if (!target.instruction) continue
        for (const fragment of instructionFragments(target)) {
            const file = path.join(repo, fragment)
            assertLineBudget(`${target.name} instruction fragment`, file, readText(file), instructionLineBudgets.fragment)
        }
        const rendered = renderInstructions(target)
        assertLineBudget(
            `${target.name} rendered instructions`,
            target.instruction.destination,
            rendered,
            target.instruction.maxLines || instructionLineBudgets.rendered,
        )
        assertStandaloneInstructions(target.name, rendered)
    }
}

function assertLineBudget(label: string, source: string, content: string, max: number) {
    const lines = lineCount(content)
    if (lines > max) throw new Error(`${label} 行数 ${lines} 超过预算 ${max}：${source}`)
}

function lineCount(content: string) {
    const text = content.trimEnd()
    return text ? text.split(/\r?\n/).length : 0
}

function assertStandaloneInstructions(target: string, content: string) {
    for (const pattern of sourceOnlyInstructionReferences) {
        if (pattern.test(content)) throw new Error(`target ${target} 指令输出引用了源文件路径：${pattern}`)
    }
}

function saveCommand(message: string) {
    if (!message.trim()) throw new Error("save 需要提交信息")
    validateCommand(true)
    assertNoDefaultExcludedGitPaths()
    const status = git(["status", "--porcelain"]).stdout.trim()
    if (!status) {
        console.log("没有可提交变更。")
        return
    }
    git(["add", "-A"], true)
    const staged = git(["diff", "--cached", "--quiet"]).status !== 0
    if (!staged) {
        console.log("没有 staged 变更。")
        return
    }
    git(["commit", "-m", message], true)
}

function syncCommand() {
    git(["pull", "--rebase"], true)
    git(["push"], true)
}

function publishCommand(message: string) {
    saveCommand(message)
    syncCommand()
}

function historyCommand() {
    process.stdout.write(git(["log", "--oneline", "-n", "20"]).stdout)
}

function rollbackCommand(ref: string | undefined, opts: Options) {
    if (!ref) throw new Error("rollback 需要 ref")
    const log = git(["log", "--oneline", `${ref}..HEAD`])
    if (log.status !== 0) throw new Error(log.stderr.trim() || `git log ${ref}..HEAD 失败`)
    const diff = git(["diff", "--stat", `${ref}..HEAD`])
    if (diff.status !== 0) throw new Error(diff.stderr.trim() || `git diff ${ref}..HEAD 失败`)
    console.log(log.stdout || "没有可回滚提交。")
    console.log(diff.stdout || "没有差异。")
    if (!opts.apply) {
        console.log("未执行回滚。若确认，请追加 --apply。")
        return
    }
    git(["revert", "--no-edit", `${ref}..HEAD`], true)
}

function installGenerated(content: string, dest: string) {
    rmSync(dest, { recursive: true, force: true })
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, content)
}

function installPath(src: string, dest: string, kind: "file" | "directory", mode: "copy" | "link", filter?: { include?: string[] }) {
    rmSync(dest, { recursive: true, force: true })
    mkdirSync(path.dirname(dest), { recursive: true })

    if (mode === "link") {
        if (kind === "directory" && filter?.include?.length) {
            mkdirSync(dest, { recursive: true })
            for (const item of filter.include) {
                const child = path.join(src, item)
                if (existsSync(child)) symlinkSync(child, path.join(dest, item), lstatSync(child).isDirectory() ? "dir" : "file")
            }
            return
        }
        symlinkSync(src, dest, kind === "directory" ? "dir" : "file")
        return
    }

    if (kind === "file") {
        copyFileSync(src, dest)
        return
    }

    mkdirSync(dest, { recursive: true })
    for (const item of readdirSync(src)) {
        if (isManagedIgnoredPath(item)) continue
        if (filter?.include?.length && !filter.include.includes(item)) continue
        copyRecursive(path.join(src, item), path.join(dest, item))
    }
}

function copyRecursive(src: string, dest: string) {
    const stat = lstatSync(src)
    if (stat.isSymbolicLink()) {
        mkdirSync(path.dirname(dest), { recursive: true })
        symlinkSync(readlinkSync(src), dest)
        return
    }
    if (stat.isDirectory()) {
        mkdirSync(dest, { recursive: true })
        for (const item of readdirSync(src)) {
            if (!isManagedIgnoredPath(item)) copyRecursive(path.join(src, item), path.join(dest, item))
        }
        return
    }
    mkdirSync(path.dirname(dest), { recursive: true })
    copyFileSync(src, dest)
}

function copyExisting(src: string, dest: string) {
    rmSync(dest, { recursive: true, force: true })
    mkdirSync(path.dirname(dest), { recursive: true })
    const stat = lstatSync(src)
    if (stat.isDirectory()) {
        copyRecursive(src, dest)
        return
    }
    if (stat.isSymbolicLink()) {
        symlinkSync(readlinkSync(src), dest)
        return
    }
    copyFileSync(src, dest)
}

function checksumText(text: string) {
    return createHash("sha256").update(text).digest("hex")
}

function checksumPath(target: string, filter?: { include?: string[] }): string {
    if (!existsSync(target)) return "missing"
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) {
        const resolved = statSync(target)
        if (resolved.isFile()) return checksumText(readFileSync(target))
        if (!resolved.isDirectory()) return checksumText(`link:${readlinkSync(target)}`)
    } else if (stat.isFile()) {
        return checksumText(readFileSync(target))
    }

    const hash = createHash("sha256")
    for (const file of scan(target, { followSymlinkDirs: true }).sort()) {
        const rel = path.relative(target, file)
        const first = rel.split(path.sep)[0]
        if (filter?.include?.length && !filter.include.includes(first)) continue
        if (isManagedIgnoredPath(rel)) continue
        const item = lstatSync(file)
        const resolved = item.isSymbolicLink() ? statSync(file) : item
        hash.update(rel)
        if (resolved.isFile()) hash.update(readFileSync(file))
        else if (item.isSymbolicLink()) hash.update(`link:${readlinkSync(file)}`)
    }
    return hash.digest("hex")
}

function restoreManifestEntries(backedManifest: Manifest, restoredDestinations: string[]) {
    const manifest = readManifest()
    const destinations = new Set(restoredDestinations)
    const restoredEntries = backedManifest.entries.filter((entry) => destinations.has(entry.destination))
    manifest.entries = [
        ...manifest.entries.filter((entry) => !destinations.has(entry.destination)),
        ...restoredEntries,
    ]
    manifest.updatedAt = new Date().toISOString()
    writeManifest(manifest)
}

function backupPath(id: string, dest: string) {
    return path.join(stateRoot, "backups", id, "files", safeName(dest))
}

function latestBackup() {
    const dir = path.join(stateRoot, "backups")
    if (!existsSync(dir)) return undefined
    return readdirSync(dir)
        .filter((item) => item.startsWith("backup-"))
        .sort()
        .at(-1)
}

function safeName(file: string) {
    return file.replaceAll("/", "__").replaceAll(":", "_")
}

function stamp() {
    return new Date().toISOString().replaceAll(":", "").replaceAll(".", "")
}

function readManifest(): Manifest {
    if (!existsSync(manifestPath)) {
        return { version: 1, repo, updatedAt: new Date().toISOString(), entries: [] }
    }
    return JSON.parse(readText(manifestPath)) as Manifest
}

function writeManifest(manifest: Manifest) {
    mkdirSync(path.dirname(manifestPath), { recursive: true })
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
}

function readText(file: string) {
    return readFileSync(file, "utf8")
}

function pathExists(file: string) {
    try {
        lstatSync(file)
        return true
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return false
        throw err
    }
}

function expandHome(file: string) {
    if (file === "~") return homedir()
    if (file.startsWith("~/")) return path.join(homedir(), file.slice(2))
    return path.resolve(file)
}

function scan(root: string, opts: { includeManagedIgnored?: boolean; followSymlinkDirs?: boolean } = {}): string[] {
    if (!existsSync(root)) return []
    const stat = lstatSync(root)
    const resolved = opts.followSymlinkDirs && stat.isSymbolicLink() ? statSync(root) : stat
    if (resolved.isFile() || (stat.isSymbolicLink() && !resolved.isDirectory())) return [root]

    const out: string[] = []
    for (const item of readdirSync(root)) {
        if (isTraversalIgnoredName(item)) continue
        if (!opts.includeManagedIgnored && isManagedIgnoredPath(item)) continue
        const child = path.join(root, item)
        const linkState = lstatSync(child)
        const state = opts.followSymlinkDirs && linkState.isSymbolicLink() ? statSync(child) : linkState
        if (state.isDirectory() && !state.isSymbolicLink()) out.push(...scan(child, opts))
        else out.push(child)
    }
    return out
}

function isTraversalIgnoredName(name: string) {
    return traversalIgnoredNames.some((pattern) => pattern.test(name))
}

function isManagedIgnoredPath(file: string) {
    return pathParts(file)
        .some((part) => isTraversalIgnoredName(part) || managedIgnoredNames.some((pattern) => pattern.test(part)))
}

function isSensitivePath(file: string) {
    return pathParts(file)
        .some((part) => sensitiveNames.some((pattern) => pattern.test(part)))
}

function pathParts(file: string) {
    return file.split(/[\\/]+/).filter(Boolean)
}

function isManagedIgnoredDestination(file: string) {
    const relativeToHome = relativeInside(homedir(), path.resolve(file))
    return isManagedIgnoredPath(relativeToHome || path.basename(file))
}

function relativeInside(root: string, file: string) {
    const relative = path.relative(root, file)
    if (!relative) return "."
    if (relative.startsWith("..") || path.isAbsolute(relative)) return undefined
    return relative
}

function assertNoDefaultExcludedGitPaths() {
    const paths = new Set([
        ...gitPathList(["ls-files", "-z"]),
        ...gitPathList(["ls-files", "--others", "--modified", "--cached", "--exclude-standard", "-z"]),
    ])
    const blocked = [...paths]
        .filter((file) => isManagedIgnoredPath(file))
        .sort()

    if (!blocked.length) return

    const shown = blocked.slice(0, 10).join(", ")
    const suffix = blocked.length > 10 ? ` 等 ${blocked.length} 项` : ""
    throw new Error(`拒绝保存默认排除内容：${shown}${suffix}`)
}

function gitPathList(args: string[]) {
    const result = git(args)
    if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(" ")} 失败`)
    return result.stdout.split("\0").filter(Boolean)
}

function parseJsonc(text: string) {
    return JSON.parse(stripJsonc(text))
}

function stripJsonc(text: string) {
    let out = ""
    let i = 0
    let str: string | undefined
    while (i < text.length) {
        const cur = text[i]
        const next = text[i + 1]
        if (str) {
            out += cur
            if (cur === "\\" && next) {
                out += next
                i += 2
                continue
            }
            if (cur === str) str = undefined
            i++
            continue
        }
        if (cur === "\"" || cur === "'") {
            str = cur
            out += cur
            i++
            continue
        }
        if (cur === "/" && next === "/") {
            while (i < text.length && text[i] !== "\n") i++
            continue
        }
        if (cur === "/" && next === "*") {
            i += 2
            while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++
            i += 2
            continue
        }
        out += cur
        i++
    }
    return out
}

function parseYamlFile(file: string) {
    return parseYaml(readText(file))
}

function parseYaml(text: string): any {
    const lines = text
        .split(/\r?\n/)
        .map((raw) => ({ raw, indent: raw.match(/^ */)?.[0].length || 0, text: raw.trim() }))
        .filter((line) => line.text && !line.text.startsWith("#"))

    function block(index: number, indent: number): [any, number] {
        if (index >= lines.length) return [{}, index]
        if (lines[index].text.startsWith("- ")) return list(index, indent)
        return map(index, indent)
    }

    function map(index: number, indent: number): [AnyRecord, number] {
        const obj: AnyRecord = {}
        while (index < lines.length && lines[index].indent >= indent) {
            const line = lines[index]
            if (line.indent !== indent || line.text.startsWith("- ")) break
            const split = line.text.match(/^([^:]+):(.*)$/)
            if (!split) throw new Error(`YAML 无法解析：${line.raw}`)
            const key = split[1].trim()
            const value = split[2].trim()
            if (value) {
                obj[key] = scalar(value)
                index++
            } else {
                const parsed = block(index + 1, indent + 2)
                obj[key] = parsed[0]
                index = parsed[1]
            }
        }
        return [obj, index]
    }

    function list(index: number, indent: number): [any[], number] {
        const arr: any[] = []
        while (index < lines.length && lines[index].indent === indent && lines[index].text.startsWith("- ")) {
            const rest = lines[index].text.slice(2).trim()
            if (!rest) {
                const parsed = block(index + 1, indent + 2)
                arr.push(parsed[0])
                index = parsed[1]
                continue
            }
            if (/^[^:]+:/.test(rest)) {
                const split = rest.match(/^([^:]+):(.*)$/)!
                const obj: AnyRecord = {}
                obj[split[1].trim()] = split[2].trim() ? scalar(split[2].trim()) : {}
                index++
                while (index < lines.length && lines[index].indent === indent + 2 && !lines[index].text.startsWith("- ")) {
                    const child = lines[index].text.match(/^([^:]+):(.*)$/)
                    if (!child) throw new Error(`YAML 无法解析：${lines[index].raw}`)
                    obj[child[1].trim()] = child[2].trim() ? scalar(child[2].trim()) : block(index + 1, indent + 4)[0]
                    index++
                }
                arr.push(obj)
                continue
            }
            arr.push(scalar(rest))
            index++
        }
        return [arr, index]
    }

    return block(0, 0)[0]
}

function scalar(value: string): any {
    if (value === "true") return true
    if (value === "false") return false
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
    if (value.startsWith("[") && value.endsWith("]")) {
        const inner = value.slice(1, -1).trim()
        return inner ? inner.split(",").map((item) => scalar(item.trim())) : []
    }
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1)
    }
    return value
}

function validateSkills(dir: string) {
    for (const skill of readdirSync(dir)) {
        const file = path.join(dir, skill, "SKILL.md")
        if (!existsSync(file)) continue
        const meta = frontmatter(readText(file))
        if (!meta.name || !meta.description) throw new Error(`skill 缺少 name/description：${file}`)
        if (meta.name !== skill) throw new Error(`skill name 与目录不一致：${file}`)
    }
}

function frontmatter(text: string) {
    if (!text.startsWith("---")) return {}
    const end = text.indexOf("\n---", 3)
    if (end < 0) return {}
    return parseYaml(text.slice(3, end))
}

function validateTomlFiles(root: string) {
    for (const file of scan(root).filter((item) => item.endsWith(".toml"))) {
        const text = readText(file)
        for (const line of text.split(/\r?\n/)) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[")) continue
            if (!trimmed.includes("=")) throw new Error(`TOML 无法解析：${file}`)
        }
    }
}

function git(args: string[], inherit = false) {
    const result = spawnSync("git", args, {
        cwd: repo,
        encoding: "utf8",
        stdio: inherit ? "inherit" : "pipe",
    })
    if (result.status !== 0 && inherit) throw new Error(`git ${args.join(" ")} 失败`)
    return { status: result.status || 0, stdout: result.stdout || "", stderr: result.stderr || "" }
}

main()
