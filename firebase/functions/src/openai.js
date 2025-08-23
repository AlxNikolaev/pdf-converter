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

function parseSlidesFromResponse(response) {
	const text = response.output_text
		|| (response.output && response.output[0] && response.output[0].content && response.output[0].content[0] && response.output[0].content[0].text)
		|| '';
	const data = JSON.parse(text);
	return Array.isArray(data.slides) ? data.slides : [];
}

module.exports = { createSlidesResponse, parseSlidesFromResponse };


