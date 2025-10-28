import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Defines the remotes for development and production
  // In production (GitHub Pages), paths are relative to the deployment base URL.
  const remotes = {
    ai_code_explainer: env.VITE_MFE_AI_CODE_EXPLAINER || 'http://localhost:3001/assets/remoteEntry.js',
    project_explorer: env.VITE_MFE_PROJECT_EXPLORER || 'http://localhost:3002/assets/remoteEntry.js',
    theme_designer: env.VITE_MFE_THEME_DESIGNER || 'http://localhost:3003/assets/remoteEntry.js',
  };

  // Shared dependencies for Module Federation
  // This ensures that common libraries like React are only loaded once.
  const sharedDependencies = {
    react: {
      singleton: true,
      requiredVersion: '18.2.0',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '18.2.0',
    },
    'react-router-dom': {
      singleton: true,
      requiredVersion: '^6.23.1',
    },
    inversify: {
      singleton: true,
      requiredVersion: '^6.0.2',
    },
  };

  return {
    // The base path for the application when deployed to GitHub Pages.
    base: '/AUToPoetic/',

    plugins: [
      react(),
      federation({
        name: 'shell',
        filename: 'remoteEntry.js',
        remotes,
        shared: sharedDependencies,
      }),
    ],

    // Configuration for the development server
    server: {
      port: 3000,
      cors: true, // Allow other origins (our MFEs) to connect
      fs: {
        allow: ['../..'], // Allow serving files from the monorepo root
      },
    },

    // Configuration for the preview server (for testing the build)
    preview: {
      port: 3000,
      cors: true,
    },

    // Build-specific configuration
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Manual chunking to optimize bundle sizes
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('inversify')) return 'vendor-inversify';
              return 'vendor'; // All other node_modules
            }
          },
        },
      },
    },

    // Path aliases to resolve cross-package imports within the monorepo
    resolve: {
      alias: {
        // Alias to monorepo root to resolve shared components and services
        '@': path.resolve(__dirname, '../../'),
        // Explicit aliases for packages to ensure consistent resolution
        '@devcore/auth-client': path.resolve(__dirname, '../auth-client/src'),
        '@devcore/composite-ui': path.resolve(__dirname, '../ui-composite/src'),
        '@devcore/core-ui': path.resolve(__dirname, '../ui-core/src'),
        '@devcore/orchestration': path.resolve(__dirname, '../orchestration/src'),
        '@devcore/theme-engine': path.resolve(__dirname, '../theme-engine/src'),
        '@devcore/worker-pool': path.resolve(__dirname, '../worker-pool/src'),
      },
    },

    // Define environment variables to be exposed to the client
    define: {
      'process.env': JSON.stringify(env),
    },
  };
});
