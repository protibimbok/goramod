import { defineConfig } from 'vite'
import goravel from './scripts/vite'

export default defineConfig({
    plugins: [
        goravel({
            input: ['@/css/main.css'],
            modules: true,
        }),
    ],
})
