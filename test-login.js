// Quick Login Test Script
// Run this to test if the backend login is working

const axios = require('axios');

async function testLogin() {
    console.log('🔍 Testing Health Center System Login...\n');

    try {
        console.log('1. Testing server health check...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Server is running:', healthResponse.data);

        console.log('\n2. Testing login endpoint...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        console.log('\n✅ ALL TESTS PASSED! Login is working correctly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 429) {
                console.error('\n⚠️  RATE LIMIT: Too many requests. Wait 15 minutes or restart the server.');
            } else if (error.response.status === 401) {
                console.error('\n⚠️  AUTHENTICATION: Invalid credentials or password not hashed correctly.');
                console.error('💡 Solution: Run "npm run seed" to reset passwords.');
            } else if (error.response.status === 500) {
                console.error('\n⚠️  SERVER ERROR: Check if database is running and migrations are complete.');
                console.error('💡 Solution: Run "npm run migrate" and "npm run migrate:new"');
            }
        } else if (error.request) {
            console.error('\n⚠️  CONNECTION ERROR: Cannot reach the server.');
            console.error('💡 Solution: Make sure the backend is running on port 3000.');
            console.error('   Run: npm run dev');
        } else {
            console.error('Error:', error.message);
        }

        process.exit(1);
    }
}

testLogin();
