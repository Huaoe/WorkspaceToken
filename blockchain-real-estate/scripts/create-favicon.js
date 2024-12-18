import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Jimp = require('jimp');
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createFavicon() {
    try {
        const image = await Jimp.read(join(__dirname, '../public/images/OIG4.jpeg'));
        await image
            .resize(32, 32)
            .quality(100)
            .writeAsync(join(__dirname, '../public/favicon.ico'));
        
        console.log('Favicon created successfully!');
    } catch (error) {
        console.error('Error creating favicon:', error);
    }
}

createFavicon();
