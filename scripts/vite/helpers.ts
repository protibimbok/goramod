import type { AddressInfo } from 'net'
import colors from 'picocolors'
import type { ResolvedConfig } from 'vite'

export const ORIGIN_PLACEHOLDER = 'http://__goravel_vite_plugin_placeholder__.test'

function configuredOrigin(config: ResolvedConfig): string | null {
    const origin = config.server.origin
    if (!origin || origin === ORIGIN_PLACEHOLDER) {
        return null
    }
    const trimmed = origin.replace(/\/+$/, '')
    let protocol: string
    try {
        protocol = new URL(trimmed).protocol
    } catch {
        protocol = ''
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
        config.logger.warn(
            colors.yellow(
                `goravel-vite-plugin: 'server.origin' is '${origin}', which is ` +
                    'not an http or https URL. Goravel reads the hot file to ' +
                    'find this server and cannot use anything else, so it is ' +
                    'being written with the address vite bound instead.',
            ),
        )
        return null
    }
    return trimmed
}

export function resolveDevServerUrl(address: AddressInfo, config: ResolvedConfig): string {
    const configured = configuredOrigin(config)
    if (configured) {
        return configured
    }
    const hmr = typeof config.server.hmr === 'object' ? config.server.hmr : null
    const configHmrProtocol = hmr?.protocol ?? null
    const clientProtocol = configHmrProtocol
        ? configHmrProtocol === 'wss'
            ? 'https'
            : 'http'
        : null
    const serverProtocol = config.server.https ? 'https' : 'http'
    const protocol = clientProtocol ?? serverProtocol
    const configHmrHost = hmr?.host ?? null
    const configHost = typeof config.server.host === 'string' ? config.server.host : null
    const serverAddress =
        isWildcard(address.address) || isIpv6Loopback(address.address)
            ? 'localhost'
            : isIpv6(address)
              ? `[${address.address}]`
              : address.address
    const usableConfigHost =
        [configHmrHost, configHost].find(
            (h): h is string => typeof h === 'string' && h !== '' && !isWildcard(h),
        ) ?? null
    const host = usableConfigHost ? bracketIpv6(usableConfigHost) : serverAddress
    if (!usableConfigHost && isWildcard(address.address)) {
        config.logger.warn(
            colors.yellow(
                'goravel-vite-plugin: vite is exposed to the network ' +
                    `(it is bound to '${address.address}'), but the hot file points ` +
                    `browsers at '${host}', which only works on this machine. For ` +
                    "other devices, set 'server.hmr.host' to the address they reach " +
                    'this machine at. Reaching vite is not enough on its own: set ' +
                    "'server.cors.origin' to the origin Goravel serves from, since " +
                    'vite answers cross-origin requests from nothing but localhost ' +
                    "by default, and 'server.allowedHosts' too if that address is a " +
                    'name rather than an IP.',
            ),
        )
    }
    const port = hmr?.clientPort ?? address.port
    return `${protocol}://${host}:${port}`
}

function bracketIpv6(host: string): string {
    if (!host.includes(':') || host.startsWith('[')) {
        return host
    }
    return `[${host}]`
}

function isWildcard(host: string): boolean {
    return host === '::' || host === '[::]' || host === '0.0.0.0'
}

function isIpv6Loopback(host: string): boolean {
    return (
        host === '::1' ||
        host === '[::1]' ||
        host === '0000:0000:0000:0000:0000:0000:0000:0001'
    )
}

function isIpv6(address: AddressInfo): boolean {
    return address.family === 'IPv6'
}
