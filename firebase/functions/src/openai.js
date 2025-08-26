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
	const text = response.text
		||	response.output_text
		|| (response.output && response.output[0] && response.output[0].content && response.output[0].content[0] && response.output[0].content[0].text)
		|| '';
	const data = JSON.parse(text);
	return Array.isArray(data.slides) ? data.slides : [];
}

module.exports = { createSlidesResponse, parseSlidesFromResponse, createTranscription };


