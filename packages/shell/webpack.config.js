const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const Dotenv = require('dotenv-webpack');

// Assumes this webpack config is run from the `packages/shell` directory.
const deps = require('./package.json').dependencies;

// --- Micro-Frontend Configuration ---
// This section defines the remote micro-frontends that the shell application will consume.
// - The key (e.g., 'aiCodeExplainer') is the internal name used for imports in the shell.
// - `devPort`: The port the MFE runs on during local development.
// - `prodPath`: The sub-directory where the MFE will be deployed for production builds.
// - `federationName`: The 'name' property from the remote's ModuleFederationPlugin config. This MUST match.
const remotesConfig = {
  aiCodeExplainer: {
    devPort: 8081,
    prodPath: 'mfes/ai-code-explainer',
    federationName: 'aiCodeExplainer',
  },
  projectExplorer: {
    devPort: 8082,
    prodPath: 'mfes/project-explorer',
    federationName: 'projectExplorer',
  },
  themeDesigner: {
    devPort: 8083,
    prodPath: 'mfes/theme-designer',
    federationName: 'themeDesigner',
  },
  // Add other remotes here as they are federated
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // The base path for deployment on GitHub Pages.
  const publicPath = isProduction ? '/AUToPoetic/' : '/';

  // Dynamically configure remote URLs based on the build environment.
  const remotes = Object.entries(remotesConfig).reduce((acc, [key, config]) => {
    // The remote entry URL format is 'name@url'.
    const remoteUrl = isProduction
      ? `${config.federationName}@${publicPath}${config.prodPath}/remoteEntry.js`
      : `${config.federationName}@http://localhost:${config.devPort}/remoteEntry.js`;
    acc[key] = remoteUrl;
    return acc;
  }, {});

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/bootstrap.tsx', // Correct entry point for the shell application.
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    output: {
      publicPath,
      clean: true, // Clean the output directory before each build.
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[id].[contenthash].js' : '[id].js',
    },

    devServer: {
      port: 8080, // The shell application runs on port 8080.
      historyApiFallback: true, // Crucial for single-page application routing.
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
      // Aliases to match tsconfig.json, resolving monorepo-wide paths correctly.
      alias: {
        '@/components': path.resolve(__dirname, '../../components'),
        '@/contexts': path.resolve(__dirname, '../../contexts'),
        '@/hooks': path.resolve(__dirname, '../../hooks'),
        '@/services': path.resolve(__dirname, '../../services'),
        '@/types': path.resolve(__dirname, '../../types.ts'),
        '@/constants': path.resolve(__dirname, '../../constants.tsx'),
        '@/utils': path.resolve(__dirname, '../../utils'),
        '@/workers': path.resolve(__dirname, '../../workers'),
        '@/themes': path.resolve(__dirname, '../../themes'),
      },
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },

    plugins: [
      new ModuleFederationPlugin({
        name: 'shell',
        filename: 'remoteEntry.js', 
        remotes,
        shared: {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
          // Share other critical libraries that should be singletons across the application.
          inversify: {
            singleton: true,
            requiredVersion: deps.inversify,
          },
          'reflect-metadata': {
            singleton: true,
            requiredVersion: deps['reflect-metadata'],
          },
        },
      }),

      new HtmlWebpackPlugin({
        // Use the root index.html as the template for the shell application.
        template: path.resolve(__dirname, '../../index.html'),
      }),

      new Dotenv(),
    ],
    
    optimization: {
      // Helps with performance and bundle splitting in production.
      splitChunks: {
          chunks: 'all',
      },
    },
  };
};
