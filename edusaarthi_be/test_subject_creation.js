const API_BASE_URL = 'http://localhost:3000';

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

        const response = await fetch(`${API_BASE_URL}/api/subjects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            console.log('\n✅ SUCCESS!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('\n❌ ERROR!');
            console.log('Status:', response.status);
            console.log('Data:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.log('\n❌ ERROR!');
        console.log('Error:', error.message);
    }
}



testSubjectCreation();
