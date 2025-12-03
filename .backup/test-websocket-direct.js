/**
 * Direct WebSocket Connection Test
 * 
 * This script attempts to connect directly to the WebSocket server
 * using the same URL construction logic as ProctorClient.ts
 */

// Configuration
const TEST_SESSION_ID = 'test-session';
const AI_SERVICE_URL = 'https://localhost:8000';

// Function to test WebSocket connection
function testWebSocketConnection() {
  try {
    // Convert HTTP/HTTPS to WS/WSS
    let baseUrl = AI_SERVICE_URL;
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'ws://');
    } else if (baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('https://', 'wss://');
    }
    
    // Extract hostname without protocol
    let hostname = baseUrl;
    if (hostname.startsWith('ws://')) hostname = hostname.substring(5);
    if (hostname.startsWith('wss://')) hostname = hostname.substring(6);
    
    // Use explicit localhost IP for better compatibility
    if (hostname.startsWith('localhost:')) {
      hostname = hostname.replace('localhost', '127.0.0.1');
    }
    
    // Construct final WebSocket URL
    const protocol = baseUrl.startsWith('wss://') ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${hostname}/ws/proctor/${TEST_SESSION_ID}`;
    
    console.log('Attempting to connect to WebSocket URL:', wsUrl);
    
    // Create WebSocket connection
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
      if (window.isSecureContext) {
        console.error('This error may be due to mixed content restrictions.');
        console.error('The browser is blocking non-secure WebSocket (ws://) connections from a secure context (https://).');
      }
      
      // Try to fetch the AI service health endpoint to check if it's running
      fetch(`${AI_SERVICE_URL}/health`, { 
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => {
          console.log('AI service health check response:', response.status);
          return response.text();
        })
        .then(data => console.log('AI service health data:', data))
        .catch(e => console.error('AI service health check failed:', e));
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
  }
}

// Add a button to test the connection
const button = document.createElement('button');
button.textContent = 'Test WebSocket Connection';
button.style.padding = '10px';
button.style.margin = '20px';
button.style.fontSize = '16px';
button.onclick = testWebSocketConnection;

document.body.appendChild(button);

// Display connection info
const info = document.createElement('div');
info.innerHTML = `
  <h3>WebSocket Connection Test</h3>
  <p>AI Service URL: ${AI_SERVICE_URL}</p>
  <p>Page Protocol: ${window.location.protocol}</p>
  <p>Secure Context: ${window.isSecureContext ? 'Yes' : 'No'}</p>
  <p>Test Session ID: ${TEST_SESSION_ID}</p>
  <p>Check browser console for detailed logs</p>
`;
document.body.appendChild(info);
