const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const Dotenv = require('dotenv-webpack');

// NOTE: This requires a 'package.json' in the same directory (packages/shell/)
// to resolve shared dependency versions.
const deps = require('./package.json').dependencies;

module.exports = {
  mode: 'development',
  entry: './src/index.tsx', // Assuming entry point is packages/shell/src/index.tsx
  devtool: 'source-map',

  output: {
    publicPath: 'auto', // Necessary for Module Federation to work with dynamic URLs
    clean: true, // Clean the output directory before each build
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 3000, // Port for the shell application
    historyApiFallback: true, // For single-page application routing
    headers: {
      // Allow loading of remote micro-frontends from different origins during development
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Assumes a babel.config.js is present
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'], // Assumes postcss.config.js is present for Tailwind
      },
    ],
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js', // The shell can also expose components if needed

      remotes: {
        // Mapping of remote micro-frontends the shell will consume.
        // The name before '@' must match the 'name' in the remote's federation config.
        ai_code_explainer: 'ai_code_explainer@http://localhost:3001/remoteEntry.js',
        project_explorer: 'project_explorer@http://localhost:3002/remoteEntry.js',
        theme_designer: 'theme_designer@http://localhost:3003/remoteEntry.js',
        feature_forge: 'feature_forge@http://localhost:3004/remoteEntry.js',
        workspace_connector_hub: 'workspace_connector_hub@http://localhost:3005/remoteEntry.js',
      },

      shared: {
        // Sharing dependencies to avoid loading them multiple times across micro-frontends.
        // React and React-DOM are critical to share as singletons.
        ...deps,
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
      },
    }),

    new HtmlWebpackPlugin({
      template: './public/index.html', // Path to the shell's HTML template
    }),

    new Dotenv(), // Exposes environment variables from a .env file to the application
  ],
};
