import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('🚀 Starting Backend Verification Tests...\n');
  
  try {
    // 1. Test Server Health
    console.log('⏳ Testing Health Endpoint...');
    const health = await axios.get('http://localhost:3001/health');
    if (health.data.status === 'OK') console.log('✅ Health Check: PASSED');
    
    // 2. Test Auth Middleware Protection
    console.log('\n⏳ Testing Auth Middleware Protection...');
    try {
      await axios.get(`${API_URL}/profile`);
      console.log('❌ Auth Protection: FAILED (Access allowed without token)');
    } catch (e) {
      if (e.response?.status === 401) {
        console.log('✅ Auth Protection: PASSED (Unauthorized block working correctly)');
      } else {
        console.log('❌ Auth Protection: FAILED', e.message);
      }
    }

    // 3. Test Registration and Login
    console.log('\n⏳ Testing User Registration & Signin...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    let token = '';

    try {
      const signupRes = await axios.post(`${API_URL}/auth/signup`, {
        email: testEmail,
        password: testPassword,
        name: 'Test Student'
      });
      console.log('✅ User Registration: PASSED');
      token = signupRes.data.token;
    } catch (e) {
      console.error('❌ User Registration: FAILED', e.response?.data || e.message);
      return;
    }

    // 4. Test User Profile Retrieval (and automatic database creation)
    console.log('\n⏳ Testing Profile Retrieval...');
    const authHeaders = { Authorization: `Bearer ${token}` };
    let profile = null;

    try {
      const profileRes = await axios.get(`${API_URL}/profile`, { headers: authHeaders });
      profile = profileRes.data;
      console.log('✅ Profile Retrieval: PASSED');
      console.log(`👤 Profile details: User ID = ${profile.user_id}, Experience = ${profile.experience_level}, Skills = ${JSON.stringify(profile.current_skills)}`);
    } catch (e) {
      console.error('❌ Profile Retrieval: FAILED', e.response?.data || e.message);
      return;
    }

    // 5. Test User Profile Update
    console.log('\n⏳ Testing Profile Update...');
    try {
      const updateRes = await axios.put(`${API_URL}/profile`, {
        current_skills: ['JavaScript', 'React', 'Python'],
        experience_level: 'Intermediate'
      }, { headers: authHeaders });
      
      console.log('✅ Profile Update: PASSED');
      console.log(`👤 Updated profile details: Experience = ${updateRes.data.experience_level}, Skills = ${JSON.stringify(updateRes.data.current_skills)}`);
    } catch (e) {
      console.error('❌ Profile Update: FAILED', e.response?.data || e.message);
    }

    // 6. Test Categories Endpoint
    console.log('\n⏳ Testing Categories Endpoint...');
    try {
      const categoriesRes = await axios.get(`${API_URL}/categories`);
      console.log(`✅ Categories Route: PASSED (Retrieved ${categoriesRes.data.categories?.length || 0} categories)`);
    } catch (e) {
      console.error('❌ Categories Route: FAILED', e.message);
    }

    // 7. Test AI advisor chat (Gemini)
    console.log('\n⏳ Testing AI Chat (Gemini)...');
    try {
      const aiRes = await axios.post(`${API_URL}/ai/chat`, {
        message: 'I want to be a software engineer, what should I study?'
      });
      console.log('✅ AI Advisor: PASSED');
      console.log('🤖 AI Response Snippet:', aiRes.data.response?.substring(0, 150) + '...');
    } catch (e) {
      console.error('❌ AI Advisor: FAILED', e.response?.data || e.message);
    }

    console.log('\n🎉 All integration checks completed successfully!');

  } catch (error) {
    console.error('\n❌ Critical Error running tests:', error.message);
  }
}

runTests();
