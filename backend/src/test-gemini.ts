import dotenv from 'dotenv';

dotenv.config();

async function runDiagnostics() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY environment variable is not defined in backend/.env');
    process.exit(1);
  }

  console.log(`🔎 Starting raw HTTP diagnostics...`);
  console.log(`🔑 API Key (masked): ${apiKey.slice(0, 10)}...`);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log(`📡 Fetching models list from: https://generativelanguage.googleapis.com/v1beta/models`);
    
    const response = await fetch(url);
    console.log(`✅ Connection Response HTTP Status: ${response.status}`);
    
    const data: any = await response.json();
    
    if (!response.ok) {
      console.error(`🔴 HTTP Error Status: ${response.status}`);
      console.error(`📝 Response Data:`, JSON.stringify(data, null, 2));
      return;
    }

    const models = data.models || [];
    console.log(`📊 Found ${models.length} available models.`);
    
    console.log(`🤖 Initializing GoogleGenAI client to test gemini-2.5-flash...`);
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log(`💬 Sending prompt to gemini-2.5-flash...`);
    const result = await model.generateContent('Write a one-word confirmation that you received this: "SUCCESS".');
    const text = result.response.text();
    console.log(`✅ Success! Response from Gemini 2.5 Flash: "${text.trim()}"`);
  } catch (error: any) {
    console.error(`❌ Diagnostics failed!`);
    console.error(`🔴 Error Message:`, error.message);
  }
}

runDiagnostics();
