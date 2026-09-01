import fs from 'fs'
import path from 'path'
import type { AddressInfo } from 'net'
import colors from 'picocolors'
import picomatch from 'picomatch'
import { normalizePath, type Logger, type Plugin, type ResolvedConfig } from 'vite'
import {
    buildUrlPrefix,
    resolveBuildConfig,
    resolvePluginConfig,
    type PluginConfig,
    type ResolvedPluginConfig,
} from './config'
import { ORIGIN_PLACEHOLDER, resolveDevServerUrl } from './helpers'
import { discoverAliases, userAliasNames, writeAliases } from './aliases'

export type { PluginConfig, PluginInput, ResolvedPluginConfig } from './config'

export function goravelVitePlugin(config: string | string[] | PluginConfig): Plugin[] {
    const resolved = resolvePluginConfig(config)
    return [...goravelPlugin(resolved), fullReload(resolved)]
}

const hotFiles = new Map<string, string>()
let exitHandlersBound = false

function claimHotFile(hotFile: string, url: string, logger: Logger): void {
    try {
        fs.mkdirSync(path.dirname(hotFile), { recursive: true })
        fs.writeFileSync(hotFile, url)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error(
            colors.red(
                `goravel-vite-plugin: could not write the hot file at '${hotFile}': ` +
                    `${message}. Goravel reads it to find this ` +
                    'server, and renders built assets until it can. Set ' +
                    "'hotFile' to a path it can write.",
            ),
        )
        return
    }
    hotFiles.set(hotFile, url)
}

function releaseHotFile(hotFile: string, url: string): void {
    if (hotFiles.get(hotFile) === url) {
        hotFiles.delete(hotFile)
    }
    try {
        if (fs.readFileSync(hotFile, 'utf-8') === url) {
            fs.rmSync(hotFile)
        }
    } catch {
        return
    }
}

function goravelPlugin(config: ResolvedPluginConfig): Plugin[] {
    let resolvedConfig: ResolvedConfig | undefined
    let userBase: string | undefined
    let setDevServerUrl!: (url: string | undefined) => void
    const devServerUrl = new Promise<string | undefined>((resolve) => {
        setDevServerUrl = resolve
    })
    let warnedNoOrigin = false

    const main: Plugin = {
        name: 'goravel-vite-plugin',
        enforce: 'pre',
        config: (userConfig, { command }) => {
            userBase = userConfig.base
            const root = userConfig.root ? path.resolve(userConfig.root) : process.cwd()
            const aliases = discoverAliases(root, config.modulesDir)
            const userClaimed = userAliasNames(userConfig.resolve?.alias)
            const ours = Object.fromEntries(
                Object.entries(aliases).filter(([name]) => !userClaimed.has(name)),
            )
            if (config.addAliases !== false) {
                writeAliases(root, aliases, userClaimed, config.addAliases === true)
            }
            return {
                base: userConfig.base ?? (command === 'build' ? buildUrlPrefix(config) : ''),
                publicDir: userConfig.publicDir ?? false,
                build: resolveBuildConfig(config, root, userConfig.build),
                server: {
                    origin: userConfig.server?.origin ?? ORIGIN_PLACEHOLDER,
                },
                resolve: {
                    alias: Array.isArray(userConfig.resolve?.alias)
                        ? Object.entries(ours).map(([find, replacement]) => ({
                              find,
                              replacement,
                          }))
                        : ours,
                },
            }
        },
        configResolved(resolved) {
            resolvedConfig = resolved
            if (resolved.command === 'serve' && userBase && userBase !== '/') {
                resolved.logger.warn(
                    colors.yellow(
                        `goravel-vite-plugin: 'base' is '${userBase}' in your ` +
                            'vite config, but the dev server is serving from ' +
                            "'/' - Goravel builds its asset URLs from the hot " +
                            'file, which carries no base, so anything served ' +
                            'under one would be asked for without it.',
                    ),
                )
            }
            if (resolved.command === 'build' && resolved.build.manifest === false) {
                resolved.logger.warn(
                    colors.yellow(
                        "goravel-vite-plugin: 'build.manifest' is false, so " +
                            'vite writes no manifest, and Goravel resolves ' +
                            'every asset it renders through one — it expects ' +
                            `to read '${path.join(config.publicDirectory, config.buildDirectory, '.vite/manifest.json')}'.`,
                    ),
                )
            }
        },
        configureServer(server) {
            if (!server.httpServer) {
                setDevServerUrl(undefined)
            }
            server.httpServer?.once('listening', () => {
                const address = server.httpServer?.address()
                const isAddressInfo = (x: unknown): x is AddressInfo =>
                    typeof x === 'object' && x !== null
                if (!isAddressInfo(address)) {
                    setDevServerUrl(undefined)
                    return
                }
                const boundUrl = resolveDevServerUrl(address, server.config)
                setDevServerUrl(boundUrl)
                claimHotFile(config.hotFile, boundUrl, server.config.logger)
                setTimeout(() => {
                    server.config.logger.info(
                        `\n  ${colors.red(colors.bold('GORAVEL'))} ${colors.dim('vite plugin')} ${colors.bold(`"${PLUGIN_VERSION}"`)}`,
                    )
                    server.config.logger.info(`  ${colors.dim('hot file:')} ${config.hotFile}`)
                    server.config.logger.info('')
                }, 100)
                server.httpServer?.once('close', () => {
                    releaseHotFile(config.hotFile, boundUrl)
                })
                if (!exitHandlersBound) {
                    const clean = (): void => {
                        for (const [hotFile, url] of [...hotFiles]) {
                            releaseHotFile(hotFile, url)
                        }
                    }
                    process.on('exit', clean)
                    process.on('SIGINT', () => process.exit())
                    process.on('SIGTERM', () => process.exit())
                    process.on('SIGHUP', () => process.exit())
                    exitHandlersBound = true
                }
            })
            return () =>
                server.middlewares.use((req, res, next) => {
                    if (req.url !== '/' && req.url !== '/index.html') {
                        return next()
                    }
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'text/html')
                    res.end(INFO_PAGE)
                })
        },
    }

    const originResolver: Plugin = {
        name: 'goravel-vite-plugin-origin-resolver',
        enforce: 'post',
        async transform(code) {
            if (!code.includes(ORIGIN_PLACEHOLDER)) {
                return null
            }
            let url: string
            if (resolvedConfig?.command === 'serve') {
                url = (await devServerUrl) ?? ''
                if (!url && !warnedNoOrigin) {
                    warnedNoOrigin = true
                    resolvedConfig.logger.warn(
                        colors.yellow(
                            'goravel-vite-plugin: could not determine the dev server URL, ' +
                                'so asset URLs are left relative to the page that loads them. ' +
                                "Set 'server.origin' in vite.config.js to the URL vite is reachable at.",
                        ),
                    )
                }
            } else {
                url = buildUrlPrefix(config).replace(/\/$/, '')
            }
            return {
                code: code.split(ORIGIN_PLACEHOLDER).join(url),
                map: null,
            }
        },
    }

    return [main, originResolver]
}

function fullReload(config: ResolvedPluginConfig): Plugin {
    if (config.refresh.length === 0) {
        return {
            name: 'goravel-vite-plugin-reloader',
        }
    }
    return {
        name: 'goravel-vite-plugin-reloader',
        apply: 'serve',
        configureServer({ ws, watcher, config: { root } }) {
            const patterns = config.refresh.map((pattern) =>
                normalizePath(path.resolve(root, pattern)),
            )
            const matches = picomatch(patterns)
            watcher.add(patterns.map((pattern) => picomatch.scan(pattern).base))
            const onFileEvent = (file: string): void => {
                if (!matches(normalizePath(file))) {
                    return
                }
                setTimeout(() => ws.send({ type: 'full-reload', path: '*' }), config.delay)
            }
            for (const event of ['change', 'add', 'unlink'] as const) {
                watcher.on(event, onFileEvent)
            }
        },
    }
}

const PLUGIN_VERSION = '0.1.0'

const INFO_PAGE = `<!DOCTYPE html>
<html>
<head>
    <title>goravel-vite-plugin</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
               display: grid; place-items: center; min-height: 100vh; margin: 0; }
        main { max-width: 34rem; padding: 2rem; }
        h1 { font-size: 1.25rem; }
        code { background: #1e293b; padding: 0.15rem 0.4rem; border-radius: 0.25rem; }
    </style>
</head>
<body>
<main>
    <h1>This is the Vite dev server, not your app</h1>
    <p>It serves assets to your Goravel application over HMR; it has no pages
       of its own. Open the Goravel app instead — while this server runs, the
       <code>{{ vite }}</code> template function points every asset here
       automatically.</p>
</main>
</body>
</html>`

export default goravelVitePlugin
