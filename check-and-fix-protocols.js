/**
 * Protocol Checker and Fixer
 * 
 * This script checks if both the frontend and AI service are running with the same protocol
 * (HTTP or HTTPS) and provides guidance on how to fix any mismatches.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const FRONTEND_PORT = 3000;
const AI_SERVICE_PORT = 8000;
const NEXT_CONFIG_PATH = path.join(__dirname, 'frontend', 'next.config.mjs');

// Check if certificates exist
function checkCertificates() {
  const certPath = path.join(__dirname, 'certs', 'cert.pem');
  const keyPath = path.join(__dirname, 'certs', 'key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('✅ SSL certificates found');
    return true;
  } else {
    console.log('❌ SSL certificates not found');
    return false;
  }
}

// Check if a service is running on a specific port and protocol
function checkService(protocol, host, port, path = '/health') {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      rejectUnauthorized: false, // Allow self-signed certificates
      timeout: 2000
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          running: true,
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', () => {
      resolve({
        running: false
      });
    });
    
    req.end();
  });
}

// Check the next.config.mjs file for AI service URL
function checkNextConfig() {
  try {
    const config = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');
    const match = config.match(/NEXT_PUBLIC_AI_SERVICE_URL.*['"]([^'"]+)['"]/);
    
    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error reading next.config.mjs:', error.message);
    return null;
  }
}

// Update the next.config.mjs file with the correct AI service URL
function updateNextConfig(url) {
  try {
    let config = fs.readFileSync(NEXT_CONFIG_PATH, 'utf8');
    
    // Replace the AI service URL
    config = config.replace(
      /(NEXT_PUBLIC_AI_SERVICE_URL.*['"])([^'"]+)(['"])/,
      `$1${url}$3`
    );
    
    fs.writeFileSync(NEXT_CONFIG_PATH, config);
    console.log(`✅ Updated next.config.mjs with AI service URL: ${url}`);
    return true;
  } catch (error) {
    console.error('Error updating next.config.mjs:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 Checking protocols for frontend and AI service...');
  
  // Check certificates
  const certsExist = checkCertificates();
  
  // Check if frontend is running on HTTP or HTTPS
  const frontendHTTP = await checkService(http, 'localhost', FRONTEND_PORT);
  const frontendHTTPS = await checkService(https, 'localhost', FRONTEND_PORT);
  
  // Check if AI service is running on HTTP or HTTPS
  const aiServiceHTTP = await checkService(http, 'localhost', AI_SERVICE_PORT);
  const aiServiceHTTPS = await checkService(https, 'localhost', AI_SERVICE_PORT);
  
  // Check next.config.mjs
  const configuredAiServiceUrl = checkNextConfig();
  
  console.log('\n📊 Current Status:');
  console.log(`- Frontend HTTP: ${frontendHTTP.running ? '✅ Running' : '❌ Not running'}`);
  console.log(`- Frontend HTTPS: ${frontendHTTPS.running ? '✅ Running' : '❌ Not running'}`);
  console.log(`- AI Service HTTP: ${aiServiceHTTP.running ? '✅ Running' : '❌ Not running'}`);
  console.log(`- AI Service HTTPS: ${aiServiceHTTPS.running ? '✅ Running' : '❌ Not running'}`);
  console.log(`- Configured AI Service URL: ${configuredAiServiceUrl || 'Not found'}`);
  
  // Determine the current protocols
  const frontendProtocol = frontendHTTPS.running ? 'https' : (frontendHTTP.running ? 'http' : null);
  const aiServiceProtocol = aiServiceHTTPS.running ? 'https' : (aiServiceHTTP.running ? 'http' : null);
  
  if (!frontendProtocol) {
    console.log('\n❌ Frontend is not running. Please start the frontend first.');
    return;
  }
  
  if (!aiServiceProtocol) {
    console.log('\n❌ AI service is not running. Please start the AI service first.');
    return;
  }
  
  console.log(`\n🔄 Frontend is running on ${frontendProtocol.toUpperCase()}`);
  console.log(`🔄 AI service is running on ${aiServiceProtocol.toUpperCase()}`);
  
  // Check for protocol mismatch
  if (frontendProtocol !== aiServiceProtocol) {
    console.log('\n⚠️ PROTOCOL MISMATCH DETECTED ⚠️');
    console.log(`Frontend is using ${frontendProtocol.toUpperCase()} but AI service is using ${aiServiceProtocol.toUpperCase()}`);
    console.log('This will cause WebSocket connection issues due to mixed content restrictions.');
    
    console.log('\n📝 Recommended Actions:');
    
    if (frontendProtocol === 'https' && aiServiceProtocol === 'http') {
      console.log('1. Stop the AI service');
      console.log('2. Start the AI service with HTTPS:');
      console.log('   cd ai_service && ./start_secure.sh');
      console.log('3. Or use the combined script:');
      console.log('   ./start-secure-servers.sh');
      
      // Update next.config.mjs if needed
      const correctUrl = 'https://localhost:8000';
      if (configuredAiServiceUrl !== correctUrl) {
        console.log('\nUpdating next.config.mjs with the correct HTTPS URL...');
        updateNextConfig(correctUrl);
      }
    } else if (frontendProtocol === 'http' && aiServiceProtocol === 'https') {
      console.log('1. Stop the frontend');
      console.log('2. Start the frontend with HTTP:');
      console.log('   cd frontend && npm run dev');
      
      // Update next.config.mjs if needed
      const correctUrl = 'http://localhost:8000';
      if (configuredAiServiceUrl !== correctUrl) {
        console.log('\nUpdating next.config.mjs with the correct HTTP URL...');
        updateNextConfig(correctUrl);
      }
    }
  } else {
    console.log('\n✅ Both services are running on the same protocol!');
    
    // Check if next.config.mjs matches the current protocol
    const expectedUrl = `${aiServiceProtocol}://localhost:8000`;
    if (configuredAiServiceUrl !== expectedUrl) {
      console.log(`\n⚠️ next.config.mjs has incorrect AI service URL: ${configuredAiServiceUrl}`);
      console.log('Updating to match current protocol...');
      updateNextConfig(expectedUrl);
    } else {
      console.log('\n✅ next.config.mjs has the correct AI service URL');
    }
  }
  
  console.log('\n🔍 WebSocket Connection Check:');
  const wsProtocol = frontendProtocol === 'https' ? 'wss' : 'ws';
  console.log(`Frontend should use ${wsProtocol}:// for WebSocket connections`);
  
  console.log('\n📋 Final Checklist:');
  console.log(`1. Frontend is running on ${frontendProtocol}://localhost:${FRONTEND_PORT}`);
  console.log(`2. AI service is running on ${aiServiceProtocol}://localhost:${AI_SERVICE_PORT}`);
  console.log(`3. WebSocket connections should use ${wsProtocol}://localhost:${AI_SERVICE_PORT}/ws/proctor/{sessionId}`);
  console.log(`4. next.config.mjs has AI service URL: ${configuredAiServiceUrl || 'Not found'}`);
}

// Run the main function
main().catch(console.error);
