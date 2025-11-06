/**
 * WebSocket Connection Test Script
 * 
 * This script tests the WebSocket connection to the AI service.
 * It helps diagnose issues with secure/insecure WebSocket connections.
 */

// Configuration
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://localhost:8000';
const TEST_SESSION_ID = 'test-session';

// Determine WebSocket URL based on AI service URL
function getWebSocketUrl(baseUrl) {
  let wsUrl;
  
  if (baseUrl.startsWith('http://')) {
    wsUrl = baseUrl.replace('http://', 'ws://');
  } else if (baseUrl.startsWith('https://')) {
    wsUrl = baseUrl.replace('https://', 'wss://');
  } else {
    wsUrl = `wss://${baseUrl}`;
  }
  
  // Extract hostname without protocol
  let hostname = wsUrl;
  if (hostname.startsWith('ws://')) hostname = hostname.substring(5);
  if (hostname.startsWith('wss://')) hostname = hostname.substring(6);
  
  // Use explicit localhost IP for better compatibility
  if (hostname.startsWith('localhost:')) {
    hostname = hostname.replace('localhost', '127.0.0.1');
  }
  
  // Construct final WebSocket URL
  const protocol = wsUrl.startsWith('wss://') ? 'wss://' : 'ws://';
  return `${protocol}${hostname}/ws/proctor/${TEST_SESSION_ID}`;
}

// Test WebSocket connection
function testWebSocketConnection() {
  const wsUrl = getWebSocketUrl(AI_SERVICE_URL);
  console.log(`Testing WebSocket connection to: ${wsUrl}`);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection established successfully!');
      console.log('Protocol used:', ws.url.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Insecure)');
      
      // Send a test message
      ws.send(JSON.stringify({
        type: 'test',
        data: 'connection-test'
      }));
      
      // Close after 2 seconds
      setTimeout(() => {
        ws.close();
        console.log('Test completed. Connection closed.');
      }, 2000);
    };
    
    ws.onmessage = (event) => {
      console.log('Received message from server:', event.data);
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection error:', error);
      
      // Check if this might be a mixed content issue
      if (typeof window !== 'undefined' && window.isSecureContext) {
        console.error('This error may be due to mixed content restrictions.');
        console.error('The browser is blocking non-secure WebSocket (ws://) connections from a secure context (https://).');
        console.error('Possible solutions:');
        console.error('1. Run the AI service with HTTPS support using: cd ai_service && ./start_secure.sh');
        console.error('2. Run the frontend without HTTPS: npm run dev instead of npm run dev:secure');
        console.error('3. Or run both with HTTPS using: ./start-secure-servers.sh');
      }
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('DOMContentLoaded', testWebSocketConnection);
} else {
  // Node.js environment
  console.log('This script should be run in a browser environment.');
}
