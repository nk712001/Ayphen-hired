require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Using Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // There is no listModels on the instance usually, it's on the class or client?
    // Actually currently ListModels is not easily exposed in the standard helper, but usually via fetch.
    // However, I will try a simple generate with a KNOWN model.
    
    console.log('Testing gemini-1.5-flash...');
    const res = await model.generateContent('Hello');
    console.log('Success:', res.response.text());
  } catch (e) {
    console.error('1.5 Flash Failed:', e.message);
  }

  try {
     console.log('Testing gemini-pro...');
     const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
     const res2 = await model2.generateContent('Hello');
     console.log('Success gemini-pro:', res2.response.text());
  } catch(e) { console.error('Pro Failed:', e.message); }
}

listModels();
