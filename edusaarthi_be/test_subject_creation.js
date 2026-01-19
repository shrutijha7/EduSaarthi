// Test script to verify subject creation endpoint
const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.21:3000';

// Get the token from your browser's localStorage and paste it here
const TOKEN = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';

async function testSubjectCreation() {
    try {
        console.log('Testing subject creation...\n');

        const payload = {
            title: 'Test Subject - Mathematics',
            category: 'General',
            instructor: 'Self',
            imageName: 'automation_workflow'
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(`${API_BASE_URL}/api/subjects`, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ ERROR!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testSubjectCreation();
