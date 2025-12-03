const https = require('https');

// Test connection to AI service
const agent = new https.Agent({
  rejectUnauthorized: false
});

const testData = {
  session_id: 'test_node_123',
  audio_data: 'dGVzdA==',
  reference_text: 'test sentence'
};

// First initialize session
console.log('Initializing session...');
const initOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/setup/speech-test/init-session',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  agent: agent
};

const initReq = https.request(initOptions, (res) => {
  console.log(`Init status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Init response:', data);
    
    // Now test speech processing
    console.log('\nTesting speech processing...');
    const processOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/setup/speech-test/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      agent: agent
    };
    
    const processReq = https.request(processOptions, (res) => {
      console.log(`Process status: ${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Process response:', data);
      });
    });
    
    processReq.on('error', (err) => {
      console.error('Process request error:', err);
    });
    
    processReq.write(JSON.stringify(testData));
    processReq.end();
  });
});

initReq.on('error', (err) => {
  console.error('Init request error:', err);
});

initReq.write(JSON.stringify({ session_id: 'test_node_123' }));
initReq.end();
