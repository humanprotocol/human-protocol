// vite.config.ts

import {defineConfig, UserConfigExport} from "vite";

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './vitest.setup.ts',
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
    } ,
} as UserConfigExport )