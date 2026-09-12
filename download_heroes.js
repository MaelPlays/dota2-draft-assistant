const fs = require('fs');
const https = require('https');
const path = require('path');

const HEROES_API_URL = 'https://api.opendota.com/api/heroes';
const IMAGE_BASE_URL = 'https://api.opendota.com';
const OUTPUT_DIR = path.join(__dirname, 'public', 'images', 'heroes');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(OUTPUT_DIR, filename);
        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(err);
        });
    });
}

async function main() {
    try {
        console.log('Fetching hero list from OpenDota...');
        const response = await new Promise((resolve, reject) => {
            https.get(HEROES_API_URL, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
                res.on('error', reject);
            });
        });

        console.log(`Found ${response.length} heroes. Starting download...`);

        for (const hero of response) {
            const imageUrl = hero.img;
            if (!imageUrl) {
                console.log(`No image URL for hero ${hero.name} (ID: ${hero.id}), skipping.`);
                continue;
            }

            // OpenDota images are usually at https://api.opendota.com/app/assets/images/heroes/...
            // We save them as {id}.png
            const filename = `${hero.id}.png`;
            try {
                await downloadImage(imageUrl, filename);
                console.log(`Downloaded: ${hero.name} -> ${filename}`);
            } catch (err) {
                console.error(`Error downloading ${hero.name}: ${err.message}`);
            }
        }

        console.log('All downloads completed!');
    } catch (error) {
        console.error('Fatal error:', error.message);
    }
}

main();
