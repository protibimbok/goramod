import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function Home() {
    const [count, setCount] = useState(0)

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">Goramod</h1>
                <p className="text-muted-foreground">
                    React, React Router and shadcn/ui are mounted. Navigate anywhere — the Go server
                    hands unmatched URLs to this app.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</Button>
                <Button variant="outline" onClick={() => setCount(0)}>
                    Reset
                </Button>
            </div>
        </div>
    )
}
