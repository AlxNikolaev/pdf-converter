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

module.exports = { extractTextFromPdf };


