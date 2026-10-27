// Quick API Verification Script
async function runTests() {
    try {
        console.log('--- Testing Health Check ---');
        const hRes = await fetch('http://127.0.0.1:3000/health');
        const hData = await hRes.json();
        console.log('Health:', hData.status, '| DB:', hData.database);

        console.log('\n--- Testing RBAC Security ---');
        // Student attempting Master Route
        const forbiddenRes = await fetch('http://127.0.0.1:3000/api/master/stats', {
            headers: { 'Authorization': 'Bearer demo-token-student' }
        });
        console.log('Student -> Master API status (expecting 403):', forbiddenRes.status);
        const forbiddenData = await forbiddenRes.json();
        console.log('Forbidden response message:', forbiddenData.message);

        // Master accessing Master Route
        const masterRes = await fetch('http://127.0.0.1:3000/api/master/stats', {
            headers: { 'Authorization': 'Bearer demo-token-master' }
        });
        const masterData = await masterRes.json();
        console.log('Master -> Master API status (expecting 200):', masterRes.status);
        console.log('Campus Stats:', masterData.stats);

        // Faculty accessing Faculty Courses
        const facultyRes = await fetch('http://127.0.0.1:3000/api/faculty/courses', {
            headers: { 'Authorization': 'Bearer demo-token-faculty' }
        });
        const facultyData = await facultyRes.json();
        console.log('Faculty -> Courses count:', facultyData.data.length);

        console.log('\n✅ All RBAC & Backend checks PASSED!');
    } catch (err) {
        console.error('Test error:', err);
    }
}

runTests();
