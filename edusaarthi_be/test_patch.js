const axios = require('axios');

async function testPatch() {
    try {
        // Since I don't have a token, I'll just check if it returns 401 or 404
        // If it returns 401, the route IS found but auth failed (correct)
        // If it returns 404, the route IS NOT found (error)
        const response = await axios.patch('http://localhost:3000/api/courses/696bbaff89f5e935585a7513', {
            title: 'Test Update'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.log('Status code:', error.response ? error.response.status : error.message);
    }
}

testPatch();
