/**
 * @file Vite configuration for the shell application.
 * @description This configuration sets up the Vite development server and build process.
 * It includes settings for:
 * - **React Plugin**: Enables Fast Refresh and other React-specific optimizations.
 * - **Module Federation**: Configures this application as the "shell" or "host" in a micro-frontend architecture,
 *   defining remote applications and shared dependencies. This is crucial for the architectural transformation.
 * - **Server Proxy**: Proxies GraphQL API requests to the Backend-for-Frontend (BFF) during local development.
 * - **Environment Variables**: Safely exposes public environment variables to the client-side code.
 * - **Build Optimizations**: Configures build output directory, source maps, and chunking strategies for performance.
 * - **Web Worker Support**: Ensures web workers are bundled correctly.
 *
 * @see {@link https://vitejs.dev/config/}
 * @see {@link https://github.com/originjs/vite-plugin-federation}
 * @performance Manually chunking node_modules improves caching and initial load performance by separating vendor code.
 * @security Environment variables are loaded from `.env` files and only explicitly defined public keys are exposed to the client.
 *           The dev server's CORS is disabled to prevent certain cross-origin request vulnerabilities.
 *           The server proxy isolates the frontend from the backend's direct address in the client code.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// List of micro-frontend remotes
// In a real-world scenario, these URLs might be managed via environment variables.
const remotes = {
    aiCodeExplainer: 'http://localhost:5001/assets/remoteEntry.js',
    projectExplorer: 'http://localhost:5002/assets/remoteEntry.js',
    themeDesigner: 'http://localhost:5003/assets/remoteEntry.js',
    // Add other micro-frontends as they are developed
};


export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            federation({
                name: 'shell',
                filename: 'remoteEntry.js',
                remotes,
                shared: ['react', 'react-dom'],
            }),
        ],
        /**
         * Configuration for the Vite development server.
         */
        server: {
            port: 5000,
            // Disable CORS. In a micro-frontend setup, this can be important, but
            // requires careful consideration of security implications.
            cors: false,
            // Proxy API requests to the BFF during development.
            // This avoids CORS issues and mimics a production environment where the
            // frontend and BFF might be served from the same domain.
            proxy: {
                '/graphql': {
                    target: 'http://localhost:4000', // URL of the BFF service
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        /**
         * Defines global constants for the client-side code.
         * Only public, non-sensitive keys should be exposed here.
         */
        define: {
            // Exposing the public Google Client ID for the OAuth flow.
            // All other secrets (API keys, etc.) are managed server-side by the AuthGateway and BFF.
            'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
        },
        /**
         * Configuration for module resolution.
         */
        resolve: {
            alias: {
                // Allows for cleaner import paths, e.g., `import '@/components/...'`
                '@': path.resolve(__dirname, '.'),
            },
        },
        /**
         * Configuration for dependency pre-bundling.
         */
        optimizeDeps: {
            exclude: [
                'axe-core',
                // @google/genai is no longer used on the client-side.
                // Keeping the exclusion is harmless but it could be removed.
                '@google/genai'
            ],
        },
        /**
         * Configuration for the build process.
         */
        build: {
            target: 'esnext', // Target modern browsers for performance.
            outDir: 'dist/shell', // Output to a specific directory for the shell app.
            sourcemap: true, // Enable source maps for production debugging.
            rollupOptions: {
                output: {
                    /**
                     * Improves caching by splitting vendor code into separate chunks.
                     * Large libraries that change infrequently are cached independently.
                     * @param {string} id - The module ID.
                     * @returns {string | undefined} The chunk name.
                     */
                    manualChunks(id: string): string | undefined {
                        if (id.includes('node_modules')) {
                            // Group major libraries into their own chunks
                            if (id.includes('react')) return 'vendor-react';
                            if (id.includes('marked')) return 'vendor-marked';
                            if (id.includes('mermaid')) return 'vendor-mermaid';
                            if (id.includes('idb')) return 'vendor-idb';
                            // Group other node_modules into a generic vendor chunk
                            return 'vendor';
                        }
                    },
                },
            },
        },
        /**
         * Configuration for Web Workers.
         */
        worker: {
            format: 'es', // Use modern ES module format for workers.
        },
    };
});
