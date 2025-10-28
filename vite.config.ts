/**
 * @file Vite configuration for the shell application (GitHub Pages ready)
 * @description Static build only, ready to deploy under /AUToPoetic/
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: '/AUToPoetic/',  // ✅ required for GitHub Pages

        plugins: [react()],

        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
        },

        define: {
            'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
        },

        optimizeDeps: {
            exclude: ['axe-core', '@google/genai'],
        },

        build: {
            target: 'esnext',
            outDir: 'dist',        // folder to deploy
            sourcemap: true,
            rollupOptions: {
                output: {
                    manualChunks(id: string) {
                        if (id.includes('node_modules')) {
                            if (id.includes('react')) return 'vendor-react';
                            if (id.includes('marked')) return 'vendor-marked';
                            if (id.includes('mermaid')) return 'vendor-mermaid';
                            if (id.includes('idb')) return 'vendor-idb';
                            return 'vendor';
                        }
                    },
                },
            },
        },

        worker: {
            format: 'es',
        },
    };
});
