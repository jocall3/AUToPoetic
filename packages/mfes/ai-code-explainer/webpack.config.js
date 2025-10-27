/**
 * @file Webpack configuration for the AiCodeExplainer Micro-Frontend.
 * @description This configuration sets up a standalone, deployable micro-frontend (MFE)
 * using Webpack and Module Federation. It's designed to be consumed by a host
 * application (shell) while also being runnable in isolation for development and testing.
 * @see https://webpack.js.org/concepts/module-federation/
 * 
 * @security This file does not handle secrets directly. Environment variables for production
 * builds should be managed through the CI/CD pipeline, not hardcoded here.
 * 
 * @performance Shared dependencies are managed via Module Federation to prevent duplication
 * in the browser, significantly improving load times in a federated architecture.
 * The configuration differentiates between development and production builds for optimization.
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

// In a real monorepo, this would be: `const deps = require('./package.json').dependencies;`
// We are defining it here because the package.json for this MFE is not in the provided context.
// The versions should align with the host application to ensure compatibility.
const sharedDependencies = {
  react: {
    singleton: true,
    requiredVersion: '^18.2.0', // This should match the version in this MFE's package.json
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^18.2.0', // This should match the version in this MFE's package.json
  },
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  // Each MFE should run on a unique port in development to avoid conflicts.
  const port = process.env.PORT || 8081;

  return {
    mode: isProduction ? 'production' : 'development',

    // In development, we want fast source maps. In production, we want detailed ones for debugging.
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    entry: './src/index',

    output: {
      // 'auto' is crucial for Module Federation to resolve public paths correctly when deployed.
      publicPath: 'auto',
      // Cleans the output directory before each build.
      clean: true,
    },

    devServer: {
      port: port,
      // Allows for deep linking in SPAs by serving index.html for any 404.
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
          },
        },
        // Assumes Tailwind CSS is used, based on the root repository configuration.
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new ModuleFederationPlugin({
        name: 'aiCodeExplainer',
        filename: 'remoteEntry.js',
        exposes: {
          // The bootstrap pattern ensures shared dependencies are properly initialized
          // before the main application component code runs.
          './AiCodeExplainer': './src/bootstrap',
        },
        shared: sharedDependencies,
      }),

      // Generates an index.html for standalone development of this micro-frontend.
      new HtmlWebpackPlugin({
        template: './public/index.html',
        chunks: ['main'],
      }),
    ],
  };
};
