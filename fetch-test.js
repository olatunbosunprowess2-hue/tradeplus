const fetch = require('node-fetch');

async function test() {
    const invalidId = 'undefined';
    const validId = '10301030-1030-1030-1030-103010301030';

    try {
        console.log(`Testing API with invalid ID: ${invalidId}`);
        const resInvalid = await fetch(`http://localhost:3333/api/listings/${invalidId}`);
        console.log(`Response Status (should be 404/400): ${resInvalid.status}`);

        console.log(`Testing API with valid ID: ${validId}`);
        const resValid = await fetch(`http://localhost:3333/api/listings/${validId}`);
        console.log(`Response Status (should be 200): ${resValid.status}`);
        if (resValid.ok) {
            const data = await resValid.json();
            console.log(`Listing Title: ${data.title}`);
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }
}
test();
