import { NavLink, Outlet } from 'react-router'

import { cn } from '@/lib/utils'

const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
]

export function RootLayout() {
    return (
        <div className="min-h-svh bg-background text-foreground">
            <header className="border-b">
                <nav className="mx-auto flex max-w-3xl items-center gap-1 px-6 py-3">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) =>
                                cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                                )
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <main className="mx-auto max-w-3xl px-6 py-10">
                <Outlet />
            </main>
        </div>
    )
}
