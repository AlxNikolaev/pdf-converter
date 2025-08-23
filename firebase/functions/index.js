const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
require('dotenv').config();
const sharp = require('sharp');

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

function sendCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

exports.convertPdfToSlides = onRequest({ region: 'us-central1', cors: false, secrets: [OPENAI_API_KEY] }, async (req, res) => {
  sendCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { pdfBase64 } = req.body || {};
    if (!pdfBase64) {
      return res.status(400).json({ error: 'pdfBase64 is required' });
    }

    const { default: pdf } = await import('pdf-parse');
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const parsed = await pdf(pdfBuffer);
    const textRaw = (parsed && parsed.text) ? parsed.text : '';
    const text = (textRaw || '').replace(/\s+/g, ' ').trim().slice(0, 24000);

    const system = `You are an assistant that converts document text into a clear set of presentation slides.
                    Return strict JSON with the following schema:
                    {
                      "slides": [
                        {
                          "title": string,
                          "bullets": string[],
                          "image_svg": string | null
                        }
                      ]
                    }
                    Rules:
                    - 5–10 slides
                    - Each slide: 3–5 concise bullets
                    - Titles are short and informative
                    - If helpful, include a simple monochrome SVG illustration (no external refs, inline <svg> only, 800x450)
                    - If not helpful, use null for image_svg
                    - Do not include markdown. Return JSON only.`;

    const user = `Source text (may be truncated):\n\n${text}`;

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() || process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' }
    });

    const jsonText = response.output_text || (response.output && response.output[0] && response.output[0].content[0].text) || '';
    let draft;
    try {
      draft = JSON.parse(jsonText);
    } catch (e) {
      logger.error('JSON parse failed', e, jsonText?.slice(0, 500));
      return res.status(502).json({ error: 'Model returned invalid JSON' });
    }

    const slides = Array.isArray(draft.slides) ? draft.slides : [];
    const resultSlides = [];
    for (const slide of slides) {
      const title = typeof slide.title === 'string' ? slide.title : '';
      const bullets = Array.isArray(slide.bullets) ? slide.bullets.filter(s => typeof s === 'string') : [];
      let imagePngBase64 = undefined;
      if (slide.image_svg && typeof slide.image_svg === 'string' && slide.image_svg.includes('<svg')) {
        try {
          const png = await sharp(Buffer.from(slide.image_svg, 'utf-8'))
            .png({ quality: 90 })
            .toBuffer();
          imagePngBase64 = png.toString('base64');
        } catch (e) {
          logger.warn('SVG rasterization failed', e);
        }
      }
      resultSlides.push({ title, bullets, imagePngBase64 });
      if (resultSlides.length >= 12) break;
    }

    return res.status(200).json({ slides: resultSlides });
  } catch (err) {
    logger.error('Unhandled error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});


