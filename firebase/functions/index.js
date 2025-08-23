const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
require('dotenv').config();
const { extractTextFromPdf, extractFirstImagePerPage } = require('./src/pdf');
const { buildSystemPrompt, buildUserPrompt, slidesSchema } = require('./src/prompts');
const { createSlidesResponse, parseSlidesFromResponse } = require('./src/openai');
const { svgToPngBase64 } = require('./src/images');

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

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const [textRaw, pageImages] = await Promise.all([
      extractTextFromPdf(pdfBuffer),
      extractFirstImagePerPage(pdfBuffer),
    ]);
    const text = (textRaw || '').replace(/\s+/g, ' ').trim().slice(0, 24000);

    const system = buildSystemPrompt();
    const user = buildUserPrompt(text);

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() || process.env.OPENAI_API_KEY });
    const response = await createSlidesResponse(openai, { system, user, schema: slidesSchema });

    let draft;
    try {
      const slidesArr = parseSlidesFromResponse(response);
      draft = { slides: slidesArr };
    } catch (e) {
      const raw = response && (response.output_text || '');
      logger.error('JSON parse failed', e, String(raw).slice(0, 500));
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
          imagePngBase64 = await svgToPngBase64(slide.image_svg);
        } catch (e) {
          logger.warn('SVG rasterization failed', e);
        }
      }
      resultSlides.push({ title, bullets, imagePngBase64 });
      if (resultSlides.length >= 12) break;
    }

    return res.status(200).json({ slides: resultSlides, pageImages });
  } catch (err) {
    logger.error('Unhandled error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});


