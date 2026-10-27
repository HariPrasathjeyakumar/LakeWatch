import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Expose static data folder under both /public/data and /data
app.use('/public/data', express.static(path.join(__dirname, 'public/data')));
app.use('/data', express.static(path.join(__dirname, 'public/data')));

// Server-side Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { site_id, site_name, timeseries, scores, change_areas, site_note, validation } = req.body;

    if (!site_id) {
      return res.status(400).json({ error: 'Missing site_id' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in server environment (GEMINI_API_KEY).',
      });
    }

    const payloadContext = JSON.stringify({
      site_id,
      site_name,
      timeseries,
      scores,
      change_areas,
      site_note,
      validation,
    }, null, 2);

    const prompt = `Review the satellite figures, scores, notes, and validation numbers below for ${site_name || site_id} and provide the requested summary.\n\nData payload:\n${payloadContext}`;

    const systemInstruction =
      'Write a 100-word plain-language summary for an official; use only the numbers and notes provided; do not invent causes, legal conclusions or numbers; say that the urgency score is relative, not absolute; mention uncertainty when "uncertain" area exceeds 20% of the loss or when the site note warns about reliability. Label the output "AI-generated summary of the figures shown".';

    let summaryText = '';
    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash'];

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API request timed out')), 6000)
        );

        const apiPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        if (response && response.text) {
          summaryText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Attempt with ${model} failed, trying fallback:`, err?.message || err);
      }
    }

    if (!summaryText) {
      // Deterministic telemetry fallback if models are rate-limited / unavailable
      const encHa = change_areas?.encroachment_ha ?? 0;
      const totalLossHa = change_areas?.total_loss_ha ?? 0;
      const uncHa = change_areas?.uncertain_ha ?? 0;
      const urgScore = scores?.urgency_score ?? 0;
      const lossPct = scores?.loss_pct_since_2017 ?? 0;
      const built500 = scores?.built_pct_within_500m ?? 0;

      const uncPct = totalLossHa > 0 ? (uncHa / totalLossHa) * 100 : 0;
      const hasUncWarning = uncPct > 20 ? ` Uncertain area accounts for ${uncPct.toFixed(1)}% of total loss, reflecting boundary pixel limits.` : '';
      const noteWarning = site_note ? ` Note: ${site_note}` : '';

      summaryText = `AI-generated summary of the figures shown for ${site_name || site_id}: Satellite telemetry records ${encHa} ha of persistent classified encroachment since 2017 (${lossPct}% reduction in wet extent). Surrounding 500m urban buffer is ${built500}% built-up. The urgency score of ${urgScore}/100 is a relative priority tier among Chennai waterbodies, not an absolute statutory conclusion.${hasUncWarning}${noteWarning}`;
    }

    return res.json({
      site_id,
      label: 'AI-generated summary of the figures shown',
      summary: summaryText,
    });
  } catch (error: any) {
    console.error('Error generating report with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate report via Gemini API',
    });
  }
});

// Production vs Development handler
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LakeWatch server active on http://0.0.0.0:${PORT}`);
});
