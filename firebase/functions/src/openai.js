async function createSlidesResponse(openai, { system, user, schema }) {
	return openai.responses.create({
		model: 'gpt-4o-mini',
		input: [
			{ role: 'system', content: system },
			{ role: 'user', content: user },
		],
		text: {
			format: {
				type: 'json_schema',
				name: 'SlidesSpec',
				schema,
				strict: true,
			},
		},
	});
}

async function createTranscription(openai, { audioBase64, audioMime }) {
	if (!audioBase64) throw new Error('audioBase64 is required');
	const buffer = Buffer.from(audioBase64, 'base64');
	const { toFile } = await import('openai/uploads');
	const file = await toFile(buffer, `audio.${(audioMime || 'audio/mpeg').split('/')[1] || 'mp3'}`, { type: audioMime || 'audio/mpeg' });
	const result = await openai.audio.transcriptions.create({
		model: 'whisper-1',
		file,
		response_format: 'verbose_json',
		timestamp_granularities: ['word'],
	});
	// result.text is present in verbose_json
	return result && (result.text || '');
}

function parseSlidesFromResponse(response) {
	function tryParse(s) {
		if (typeof s !== 'string') return null;
		const cleaned = s.trim()
			.replace(/^```json\n?/i, '')
			.replace(/\n?```$/i, '');
		try { return JSON.parse(cleaned); } catch { return null; }
	}

	let data = tryParse(response && response.output_text);
	if (!data && response && typeof response.text === 'string') {
		data = tryParse(response.text);
	}
	if (!data && Array.isArray(response && response.output)) {
		const parts = [];
		for (const item of response.output) {
			if (Array.isArray(item.content)) {
				for (const c of item.content) {
					if (typeof c.text === 'string') parts.push(c.text);
				}
			}
		}
		data = tryParse(parts.join('\n'));
	}
	if (!data && response && typeof response === 'object' && Array.isArray(response.slides)) {
		data = response;
	}
	if (!data) throw new Error('Model returned non-JSON output');
	return Array.isArray(data.slides) ? data.slides : [];
}

module.exports = { createSlidesResponse, parseSlidesFromResponse, createTranscription };


