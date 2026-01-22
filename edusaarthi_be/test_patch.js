

async function testPatch() {
    try {
        // Since I don't have a token, I'll just check if it returns 401 or 404
        // If it returns 401, the route IS found but auth failed (correct)
        // If it returns 404, the route IS NOT found (error)
        const response = await fetch('http://localhost:3000/api/courses/696bbaff89f5e935585a7513', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Test Update'
            })
        });

        const data = await response.json().catch(() => ({}));
        console.log('Status code:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.log('Error:', error.message);
    }
}

testPatch();
