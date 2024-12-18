import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createFavicons() {
    try {
        // Create base resized image
        const image = sharp(join(__dirname, '../public/images/OIG4.jpeg'))
            .resize(32, 32);

        // Generate PNG buffer for ICO
        const pngBuffer = await image
            .clone()
            .png()
            .toBuffer();
        
        // Save as ICO
        await fs.writeFile(join(__dirname, '../app/favicon.ico'), pngBuffer);
        
        // Generate and save SVG
        await image
            .clone()
            .toFormat('svg')
            .toFile(join(__dirname, '../app/icon.svg'));
        
        console.log('Favicons created successfully!');
    } catch (error) {
        console.error('Error creating favicons:', error);
    }
}

createFavicons();
