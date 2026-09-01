import path from 'path'
import type { BuildOptions, UserConfig } from 'vite'
import { expandEntry } from './aliases'

export type PluginInput = string | string[] | Record<string, string>

export interface PluginConfig {
    input: PluginInput
    publicDirectory?: string
    buildDirectory?: string
    hotFile?: string
    modules?: boolean | string
    addAliases?: boolean | 'update-only'
    refresh?: boolean | string[]
    delay?: number
}

export interface ResolvedPluginConfig {
    input: PluginInput
    publicDirectory: string
    buildDirectory: string
    hotFile: string
    modulesDir: string | null
    addAliases: boolean | 'update-only'
    refresh: string[]
    delay: number
}

export function refreshDefaults(modulesDir: string | null): string[] {
    const patterns = ['resources/views/**', 'routes/**/*.go', 'app/**/*.go']
    if (modulesDir) {
        patterns.push(`${modulesDir}/**/*.go`, `${modulesDir}/*/resources/views/**`)
    }
    return patterns
}

export function resolvePluginConfig(
    config: string | string[] | PluginConfig | undefined,
): ResolvedPluginConfig {
    if (typeof config === 'string' || Array.isArray(config)) {
        config = { input: config }
    }
    if (!config || typeof config.input === 'undefined') {
        throw new Error(
            'goravel-vite-plugin: no input is provided! Pass the entry ' +
                "points, e.g. goravel(['resources/js/app.js']).",
        )
    }
    const publicDirectory = trimSlashes(config.publicDirectory ?? 'public')
    const buildDirectory = trimSlashes(config.buildDirectory ?? 'build')
    const modulesDir =
        config.modules === true
            ? 'modules'
            : typeof config.modules === 'string'
              ? trimSlashes(config.modules)
              : null
    return {
        input: config.input,
        publicDirectory,
        buildDirectory,
        hotFile: config.hotFile ?? path.join(publicDirectory, 'hot'),
        modulesDir,
        addAliases: config.addAliases ?? 'update-only',
        refresh:
            config.refresh === true || config.refresh === undefined
                ? refreshDefaults(modulesDir)
                : config.refresh || [],
        delay: config.delay ?? 500,
    }
}

function trimSlashes(value: string): string {
    return value.trim().replace(/^\/+|\/+$/g, '')
}

export function buildUrlPrefix(config: ResolvedPluginConfig): string {
    return `/${config.buildDirectory}/`
}

export function resolveBuildConfig(
    config: ResolvedPluginConfig,
    root: string,
    front: UserConfig['build'],
): BuildOptions {
    const build: BuildOptions = {
        manifest: front?.manifest ?? true,
        outDir:
            front?.outDir ?? path.resolve(root, config.publicDirectory, config.buildDirectory),
        assetsInlineLimit: front?.assetsInlineLimit ?? 0,
        emptyOutDir: front?.emptyOutDir ?? true,
    }
    if (front?.rollupOptions?.input === undefined) {
        build.rollupOptions = {
            input: underRoot(config.input, root, config.modulesDir),
        }
    }
    return build
}

function underRoot(input: PluginInput, root: string, modulesDir: string | null): PluginInput {
    const under = (entry: string): string => path.resolve(root, expandEntry(entry, modulesDir))
    if (typeof input === 'string') {
        return under(input)
    }
    if (Array.isArray(input)) {
        return input.map(under)
    }
    return Object.fromEntries(Object.entries(input).map(([name, entry]) => [name, under(entry)]))
}
