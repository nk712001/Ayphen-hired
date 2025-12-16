const https = require('https');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
if (!key) { console.log('No Key'); process.exit(1); }

// Strip possible quotes
const cleanKey = key.replace(/['"]/g, '').trim();

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;

console.log('Fetching models...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 500)); // Show start
    try {
        const json = JSON.parse(data);
        if (json.models) {
            console.log('Available Models:', json.models.map(m => m.name));
        } else {
            console.log('No models property:', json);
        }
    } catch(e) { console.log('Not JSON'); }
  });
}).on('error', e => console.error(e));
