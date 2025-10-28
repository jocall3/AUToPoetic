/**
 * @file Vite configuration for the shell application (GitHub Pages ready)
 * @description This configuration is for the root application (shell) and includes
 *              comprehensive path aliasing to support the monorepo structure and fix
 *              module resolution errors during the build process. It is configured for a
 *              static build suitable for deployment on GitHub Pages.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Set the base path for GitHub Pages deployment under the /AUToPoetic/ repository.
        base: '/AUToPoetic/',

        plugins: [react()],

        resolve: {
            alias: {
                // Aliases for root-level directories to match tsconfig.json and fix resolution issues
                '@/components': path.resolve(__dirname, './components'),
                '@/contexts': path.resolve(__dirname, './contexts'),
                '@/hooks': path.resolve(__dirname, './hooks'),
                '@/services': path.resolve(__dirname, './services'),
                '@/types': path.resolve(__dirname, './types.ts'),
                '@/utils': path.resolve(__dirname, './utils'),
                '@/workers': path.resolve(__dirname, './workers'),
                '@/public': path.resolve(__dirname, './public'),

                // Aliases to fix incorrect hypothetical paths seen in various component imports
                '@/ui/composite': path.resolve(__dirname, './packages/ui-composite/src'),
                '@/ui/core': path.resolve(__dirname, './packages/ui-core/src'),

                // Aliases for monorepo packages to ensure they resolve correctly during the build
                '@devcore/auth-client': path.resolve(__dirname, './packages/auth-client/src'),
                '@devcore/orchestration': path.resolve(__dirname, './packages/orchestration/src'),
                '@devcore/theme-engine': path.resolve(__dirname, './packages/theme-engine/src'),
                '@devcore/composite-ui': path.resolve(__dirname, './packages/ui-composite/src'),
                '@devcore/core-ui': path.resolve(__dirname, './packages/ui-core/src'),
                '@devcore/worker-pool': path.resolve(__dirname, './packages/worker-pool/src'),
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
            outDir: 'dist', // Standard output directory for the shell application build
            sourcemap: true,
            rollupOptions: {
                output: {
                    // Manual chunking strategy to group common libraries for better caching
                    manualChunks(id: string) {
                        if (id.includes('node_modules')) {
                            if (id.includes('react')) return 'vendor-react';
                            if (id.includes('marked')) return 'vendor-marked';
                            if (id.includes('mermaid')) return 'vendor-mermaid';
                            if (id.includes('idb')) return 'vendor-idb';
                            return 'vendor'; // All other node_modules
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
