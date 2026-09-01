import { createBrowserRouter } from 'react-router'

import { RootLayout } from '@/components/root-layout'
import { About } from '@/pages/about'
import { Home } from '@/pages/home'
import { NotFound } from '@/pages/not-found'

export const router = createBrowserRouter([
    {
        path: '/',
        Component: RootLayout,
        children: [
            { index: true, Component: Home },
            { path: 'about', Component: About },
            { path: '*', Component: NotFound },
        ],
    },
])
