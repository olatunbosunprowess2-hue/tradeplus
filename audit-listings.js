const http = require('http');

const ids = [
    "10101010-1010-1010-1010-101010101010",
    "10201020-1020-1020-1020-102010201020",
    "10301030-1030-1030-1030-103010301030",
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
    "44444444-4444-4444-4444-444444444444",
    "55555555-5555-5555-5555-555555555555"
];

async function check(id) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: `/listings/${id}`,
            method: 'HEAD'
        }, (res) => {
            resolve({ id, status: res.statusCode });
        });
        req.on('error', (e) => resolve({ id, error: e.message }));
        req.end();
    });
}

async function run() {
    for (const id of ids) {
        const res = await check(id);
        console.log(`${res.id}: ${res.status || res.error}`);
    }
}

run();
