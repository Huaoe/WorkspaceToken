const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

async function createFavicons() {
    try {
        const sourcePath = path.join(__dirname, '../public/images/OIG4.jpeg');
        const faviconPath = path.join(__dirname, '../public/images/favicon.ico');
        const pngIconPath = path.join(__dirname, '../public/images/icon.png');

        console.log('Source image path:', sourcePath);
        console.log('Target favicon path:', faviconPath);
        console.log('Target icon path:', pngIconPath);

        // Verify source image exists
        try {
            await fs.access(sourcePath);
            console.log('Source image exists');
        } catch (error) {
            console.error('Source image not found:', error);
            return;
        }

        // Create base resized image
        console.log('Creating base image...');
        const image = sharp(sourcePath)
            .resize(32, 32);

        // Generate PNG buffer for ICO
        console.log('Generating PNG buffer...');
        const pngBuffer = await image
            .clone()
            .png()
            .toBuffer();
        
        // Ensure images directory exists
        const imagesDir = path.join(__dirname, '../public/images');
        try {
            await fs.access(imagesDir);
        } catch {
            console.log('Creating images directory...');
            await fs.mkdir(imagesDir, { recursive: true });
        }
        
        // Save as ICO
        console.log('Saving favicon.ico...');
        await fs.writeFile(faviconPath, pngBuffer);
        
        // Generate and save PNG icon
        console.log('Saving icon.png...');
        await image
            .clone()
            .png()
            .toFile(pngIconPath);
        
        console.log('Favicons created successfully!');
    } catch (error) {
        console.error('Error creating favicons:', error);
    }
}

createFavicons();
