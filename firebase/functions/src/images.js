const sharp = require('sharp');

async function svgToPngBase64(svgString) {
	const png = await sharp(Buffer.from(svgString, 'utf-8')).png({ quality: 90 }).toBuffer();
	return png.toString('base64');
}

module.exports = { svgToPngBase64 };


