import { defineConfig } from 'cypress';

const webpackConfig = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    ]
  }
};

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const preprocessor = require('@cypress/webpack-preprocessor');
      on('file:preprocessor', preprocessor({
        webpackOptions: webpackConfig
      }));
      return config;
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'next',
      webpackConfig
    }
  }
});
