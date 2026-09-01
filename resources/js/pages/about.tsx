export function About() {
    return (
        <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">About</h1>
            <p className="text-muted-foreground">
                This page is resolved entirely client-side. Reload it — the server still serves the
                shell and the router picks the URL back up.
            </p>
        </div>
    )
}
