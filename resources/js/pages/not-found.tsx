import { Link, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFound() {
    const { pathname } = useLocation()

    return (
        <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">404</p>
            <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-muted-foreground">
                No route matches <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{pathname}</code>.
            </p>
            <Button asChild>
                <Link to="/">Back home</Link>
            </Button>
        </div>
    )
}
