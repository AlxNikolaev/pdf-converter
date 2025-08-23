async function extractTextFromPdf(buffer, pageLimit = 30) {
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
	const doc = await loadingTask.promise;
	let combined = '';
	const maxPages = Math.min(doc.numPages, pageLimit);
	for (let i = 1; i <= maxPages; i++) {
		const page = await doc.getPage(i);
		const content = await page.getTextContent();
		combined += content.items.map((it) => it.str).join(' ') + '\n';
	}
	return combined;
}

async function extractFirstImagePerPage(buffer, pageLimit = 30) {
	const sharp = (await import('sharp')).default || require('sharp');
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const OPS = pdfjs.OPS;
	const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
	const doc = await loadingTask.promise;
	const maxPages = Math.min(doc.numPages, pageLimit);
	const images = new Array(maxPages).fill(null);
	for (let i = 1; i <= maxPages; i++) {
		try {
			const page = await doc.getPage(i);
			const opList = await page.getOperatorList();
			let imageName = null;
			for (let j = 0; j < opList.fnArray.length; j++) {
				const fn = opList.fnArray[j];
				const args = opList.argsArray[j];
				if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
					imageName = args && args[0];
					break;
				}
				if (fn === OPS.paintInlineImageXObject) {
					// Inline image object sometimes comes as an object in args[0]
					const img = args && args[0];
					if (img && img.data && img.width && img.height) {
						const raw = Buffer.from(img.data);
						const png = await sharp(raw, { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer();
						images[i - 1] = png.toString('base64');
						imageName = null;
						break;
					}
				}
			}
			if (imageName) {
				const obj = page.objs && page.objs.get && page.objs.get(imageName);
				if (obj && obj.data && obj.width && obj.height) {
					const raw = Buffer.from(obj.data);
					const png = await sharp(raw, { raw: { width: obj.width, height: obj.height, channels: 4 } }).png().toBuffer();
					images[i - 1] = png.toString('base64');
				}
			}
		} catch (_) {
			// best-effort per page; ignore extraction errors
		}
	}
	return images;
}

module.exports = { extractTextFromPdf, extractFirstImagePerPage };


