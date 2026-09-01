import fs from 'fs'
import path from 'path'
import { normalizePath, type AliasOptions } from 'vite'
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser'

export type Aliases = Record<string, string>

export function userAliasNames(alias: AliasOptions | undefined): Set<string> {
    if (!alias) {
        return new Set()
    }
    if (Array.isArray(alias)) {
        return new Set(
            alias
                .map((entry) => entry.find)
                .filter((find): find is string => typeof find === 'string'),
        )
    }
    return new Set(Object.keys(alias))
}

export function discoverAliases(root: string, modulesDir: string | null): Aliases {
    const aliases: Aliases = {
        '@': normalizePath(path.resolve(root, 'resources/js')),
    }
    if (!modulesDir) {
        return aliases
    }
    const dir = path.resolve(root, modulesDir)
    let entries: fs.Dirent[]
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
        return aliases
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }
        const resources = path.join(dir, entry.name, 'resources', 'js')
        if (fs.existsSync(resources)) {
            aliases[`@${entry.name}`] = normalizePath(resources)
        }
    }
    return aliases
}

export function expandEntry(entry: string, modulesDir: string | null): string {
    if (!entry.startsWith('@')) {
        return entry
    }
    if (entry.startsWith('@/')) {
        return path.posix.join('resources/js', entry.slice(2))
    }
    if (!modulesDir) {
        return entry
    }
    const slash = entry.indexOf('/')
    if (slash <= 1 || slash === entry.length - 1) {
        return entry
    }
    return path.posix.join(
        modulesDir,
        entry.slice(1, slash),
        'resources/js',
        entry.slice(slash + 1),
    )
}

const CONFIG_FILES = ['tsconfig.app.json', 'tsconfig.json', 'jsconfig.json']

type PathsMap = Record<string, string[]>

interface ConfigWithPaths {
    compilerOptions?: {
        paths?: PathsMap
    }
}

export function writeAliases(
    root: string,
    aliases: Aliases,
    userClaimed: Set<string>,
    createIfMissing: boolean,
): void {
    let cfgPath = CONFIG_FILES.map((name) => path.join(root, name)).find((candidate) =>
        fs.existsSync(candidate),
    )
    if (!cfgPath) {
        if (!createIfMissing) {
            return
        }
        cfgPath = path.join(root, 'jsconfig.json')
        fs.writeFileSync(cfgPath, JSON.stringify({ exclude: ['node_modules'] }, null, 2))
    }
    const fileContent = fs.readFileSync(cfgPath, 'utf8')
    const errors: ParseError[] = []
    const jsonNode: unknown = parse(fileContent, errors, {
        disallowComments: false,
        allowTrailingComma: true,
    })
    if (
        errors.length > 0 ||
        typeof jsonNode !== 'object' ||
        jsonNode === null ||
        Array.isArray(jsonNode)
    ) {
        console.warn(
            `goravel-vite-plugin: ${cfgPath} is not valid JSON, ` +
                'so the aliases were not written into it',
        )
        return
    }
    const old: PathsMap = (jsonNode as ConfigWithPaths).compilerOptions?.paths ?? {}
    const isOurs = (alias: string): boolean => {
        const name = alias.endsWith('/*') ? alias.slice(0, -2) : alias
        return Object.hasOwn(aliases, name) && !userClaimed.has(name)
    }
    const updatedPaths: PathsMap = {}
    for (const [alias, value] of Object.entries(old)) {
        if (!isOurs(alias)) {
            updatedPaths[alias] = value
        }
    }
    for (const [alias, target] of Object.entries(aliases)) {
        if (userClaimed.has(alias)) {
            continue
        }
        let val = normalizePath(path.relative(root, target))
        if (val !== '.') {
            val = './' + val
        }
        updatedPaths[alias + '/*'] = [val + '/*']
    }
    const edits = modify(fileContent, ['compilerOptions', 'paths'], updatedPaths, {
        formattingOptions: {
            tabSize: 2,
            insertSpaces: true,
            keepLines: true,
        },
    })
    const newContent = applyEdits(fileContent, edits)
    if (newContent !== fileContent) {
        fs.writeFileSync(cfgPath, newContent, 'utf-8')
    }
}
