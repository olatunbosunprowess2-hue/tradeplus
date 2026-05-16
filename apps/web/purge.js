const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function signJwt(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64url');
    return `${signatureInput}.${signature}`;
}

async function run() {
    console.log('Generating service_role token...');
    const secret = "fhwE0ItmD1FG9RaQcIt0CC18yeV7uk7cIL9s2QupiMqeQpvl6YIRjuw9QHRsp0Idt2TLbDR7fR9Ms9ouHCVvfw==";
    const payload = {
        role: 'service_role',
        iss: 'supabase',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60
    };
    const token = signJwt(payload, secret);

    console.log('Connecting to Supabase...');
    const supabaseUrl = "https://ueblqvobbpoukuyjoxwe.supabase.co";
    const supabase = createClient(supabaseUrl, token, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('Fetching buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('Failed to list buckets:', bucketError);
        return;
    }

    if (!buckets || buckets.length === 0) {
        console.log('No buckets found.');
        return;
    }

    console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name).join(', '));

    for (const bucket of buckets) {
        console.log(`\nPurging bucket: ${bucket.name}...`);
        await emptyBucket(supabase, bucket.name);
    }

    console.log('\nAll buckets purged successfully.');
}

async function emptyBucket(supabase, bucketName) {
    // List files in the bucket
    // Since list can only fetch a limited number of items, we'll paginate
    let allFiles = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
        console.log(`  Fetching files (offset: ${offset})...`);
        const { data, error } = await supabase.storage.from(bucketName).list('', {
            limit: limit,
            offset: offset,
        });

        if (error) {
            console.error(`  Error listing files in ${bucketName}:`, error);
            break;
        }

        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allFiles = allFiles.concat(data);
            offset += data.length;
            if (data.length < limit) {
                hasMore = false;
            }
        }
    }

    console.log(`  Found ${allFiles.length} items in ${bucketName}.`);

    if (allFiles.length === 0) return;

    // Filter out directories (if supabase returns them) and delete in chunks
    // The list API might return files and directories (where name might not be deletable directly if it's a folder, but typically in S3 buckets we just delete the objects)
    const filesToDelete = allFiles.filter(x => x.name !== '.emptyFolderPlaceholder').map(x => x.name);
    
    // Supabase JS storage `remove` takes an array of paths
    // Let's delete in chunks of 100
    for (let i = 0; i < filesToDelete.length; i += 100) {
        const chunk = filesToDelete.slice(i, i + 100);
        console.log(`  Deleting chunk ${i} to ${i + chunk.length}...`);
        const { data, error } = await supabase.storage.from(bucketName).remove(chunk);
        if (error) {
            console.error(`  Error deleting files in ${bucketName}:`, error);
        }
    }

    console.log(`  Finished purging ${bucketName}.`);
}

run().catch(console.error);
