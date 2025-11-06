const https = require('https');
const fs = require('fs');
const path = require('path');

// SSL certificate paths
const certFile = path.join(__dirname, 'certs/cert.pem');
const keyFile = path.join(__dirname, 'certs/key.pem');

// Check if certificates exist
if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
  console.error('SSL certificates not found. Please make sure they exist at:', {
    certFile,
    keyFile
  });
  process.exit(1);
}

// Test certificate validity
try {
  const cert = fs.readFileSync(certFile, 'utf8');
  const key = fs.readFileSync(keyFile, 'utf8');
  
  console.log('✅ Certificates loaded successfully');
  
  // Display certificate info
  console.log('\nCertificate Information:');
  console.log('------------------------');
  console.log(`Certificate File: ${certFile}`);
  console.log(`Certificate Size: ${fs.statSync(certFile).size} bytes`);
  console.log(`Key File: ${keyFile}`);
  console.log(`Key Size: ${fs.statSync(keyFile).size} bytes`);
  
  // Create a simple HTTPS server to test the certificates
  const server = https.createServer({ key, cert }, (req, res) => {
    res.writeHead(200);
    res.end('HTTPS Certificate Test Successful!');
  });
  
  // Start the server on a test port
  const TEST_PORT = 8443;
  server.listen(TEST_PORT, () => {
    console.log(`\n✅ Test HTTPS server running at https://localhost:${TEST_PORT}`);
    console.log('\nCertificate test successful! Your certificates are valid.');
    console.log('\nTo start the servers with HTTPS:');
    console.log('1. FastAPI AI Service: python ai_service/main.py');
    console.log('2. Next.js Frontend: cd frontend && npm run dev:secure');
    
    // Close the test server after 5 seconds
    setTimeout(() => {
      server.close(() => {
        console.log('\nTest server closed');
      });
    }, 5000);
  });
  
} catch (error) {
  console.error('Error testing certificates:', error);
  process.exit(1);
}
