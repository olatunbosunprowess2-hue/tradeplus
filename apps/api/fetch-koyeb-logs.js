const axios = require('axios');
require('dotenv').config({ path: '.env' });

// We need a Koyeb API token. Let's see if the user has one locally, or we'll ask them to provide one if this fails.
// Alternatively, we can use the Koyeb CLI if it's installed.

async function getKoyebLogs() {
    const serviceId = '1992b363-8e28-496b-a687-a51db4167a29'; // From the browser URL user shared
    try {
        const { execSync } = require('child_process');
        console.log('Trying koyeb CLI...');
        const out = execSync(`koyeb service logs ${serviceId} --limit 200`, { encoding: 'utf-8' });
        console.log(out);
    } catch (e) {
        console.error('Koyeb CLI failed or not installed.', e.message);
    }
}

getKoyebLogs();
