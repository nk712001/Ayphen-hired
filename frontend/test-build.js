/**
 * Test build script for Next.js application
 * Verifies that the project builds successfully
 */

const { execSync } = require('child_process');

/**
 * Logs a message to stdout with a timestamp
 * @param {string} message - The message to log
 */
function logInfo(message) {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${message}\n`);
}

/**
 * Logs an error message to stderr with a timestamp
 * @param {string} message - The error message to log
 */
function logError(message) {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] [ERROR] ${message}\n`);
}

/**
 * Main function to execute the build test
 */
function runBuildTest() {
  logInfo('Starting Next.js build test...');
  
  try {
    logInfo('Running npm run build...');
    execSync('npm run build', { stdio: 'inherit' });
    logInfo('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute the build test
runBuildTest();
