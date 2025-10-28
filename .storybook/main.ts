import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../packages/ui-core/src/**/*.mdx',
    '../packages/ui-core/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/ui-composite/src/**/*.mdx',
    '../packages/ui-composite/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.mdx',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-styling',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@devcore/core-ui': path.resolve(__dirname, '../packages/ui-core/src'),
          '@devcore/composite-ui': path.resolve(
            __dirname,
            '../packages/ui-composite/src',
          ),
          '@/components': path.resolve(__dirname, '../components'),
          '@/contexts': path.resolve(__dirname, '../contexts'),
          '@/hooks': path.resolve(__dirname, '../hooks'),
          '@/services': path.resolve(__dirname, '../services'),
          '@/types': path.resolve(__dirname, '../types.ts'),
        },
      },
    });
  },
};

export default config;
