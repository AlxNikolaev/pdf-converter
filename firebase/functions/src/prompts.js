function buildSystemPrompt() {
	return (
		'You are an assistant that converts document text into a clear set of presentation slides.' +
		' Return only JSON matching the provided schema.' +
		' Rules: 5–10 slides, each with 3–5 concise bullets, short informative titles.' +
		' If helpful, include a simple monochrome inline <svg> illustration sized ~800x450; otherwise set image_svg to null.'
	);
}

function buildUserPrompt(sourceText) {
	return `Source text (may be truncated):\n\n${sourceText}`;
}

const slidesSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['slides'],
	properties: {
		slides: {
			type: 'array',
			minItems: 5,
			maxItems: 12,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['title', 'bullets', 'image_svg'],
				properties: {
					title: { type: 'string', minLength: 1, maxLength: 120 },
					bullets: {
						type: 'array',
						minItems: 3,
						maxItems: 5,
						items: { type: 'string', minLength: 1, maxLength: 240 },
					},
					image_svg: { anyOf: [{ type: 'string' }, { type: 'null' }] },
				},
			},
		},
	},
};

module.exports = {
	buildSystemPrompt,
	buildUserPrompt,
	slidesSchema,
};


