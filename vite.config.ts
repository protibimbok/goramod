import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import goravel from './scripts/vite'

export default defineConfig({
    plugins: [
        goravel({
            input: ['@/main.css', '@/app.tsx'],
            modules: true,
        }),
        react(),
        tailwindcss(),
    ],
})
