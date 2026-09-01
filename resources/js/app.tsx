import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { router } from '@/router'

const container = document.getElementById('app')
if (!container) {
    throw new Error('React root element #app not found')
}

createRoot(container).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
