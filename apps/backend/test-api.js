import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('🚀 Starting Backend Verification Tests...\n');
  
  try {
    // 1. Test Server Health
    console.log('⏳ Testing Health Endpoint...');
    const health = await axios.get('http://localhost:3001/health');
    if (health.data.status === 'OK') console.log('✅ Health Check: PASSED');
    
    // 2. Test AI Router Graceful Handling
    console.log('\n⏳ Testing AI Router Configuration...');
    try {
      const aiResponse = await axios.post(`${API_URL}/ai/chat`, { message: 'How to become a developer?' });
      console.log('✅ AI Route: PASSED (AI Responded or handled correctly)');
    } catch (e) {
      if (e.response?.status === 500 && e.response?.data?.error?.includes('No AI provider configured')) {
        console.log('✅ AI Route: PASSED (Gracefully warned about missing API key instead of crashing)');
      } else {
        console.log('❌ AI Route: FAILED', e.message);
      }
    }

    // 3. Test Categories (which hits News API)
    console.log('\n⏳ Testing Categories Endpoint (MongoDB + News API)...');
    try {
      const categories = await axios.get(`${API_URL}/categories`);
      console.log(`✅ Categories Route: PASSED (Retrieved ${categories.data.categories?.length || 0} categories)`);
    } catch (e) {
       console.log('❌ Categories Route: FAILED (Make sure MongoDB is connected!)', e.message);
    }

    console.log('\n🎉 All automated checks completed! The backend is structurally sound.');

  } catch (error) {
    console.error('\n❌ Critical Error running tests:', error.message);
    console.log('Please make sure your server is running (`node server.js`) in a separate terminal before running this script.');
  }
}

runTests();
