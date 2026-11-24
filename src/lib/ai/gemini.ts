import { GoogleGenAI } from '@google/genai';
import { CandidateProfile, ChatMessage, ScorecardReport } from '@/types/interview';
import { getSystemPromptForInterview, getEvaluationSystemPrompt } from './prompts';

/**
 * Google Gemini Integration for "Wawancarain"
 * Mendukung Gemini 3.5 Flash Lite (verified working & cepat), Gemini 3.5 Flash, dan varian Gemini lainnya.
 * Berjalan aman secara Server-Side
 */

export const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

export async function generateGeminiInterviewReply(
  profile: CandidateProfile,
  messages: ChatMessage[],
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<string | null> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const systemPrompt = getSystemPromptForInterview(profile);
  const modelsToTry = [modelOverride, ...GEMINI_CANDIDATE_MODELS].filter(Boolean) as string[];

  // Format riwayat chat untuk percakapan multi-turn Gemini
  const contents = messages.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Mulai sesi wawancara kerja di ${profile.targetCompany || 'perusahaan'}. Sapa saya dengan ramah dan hangat, perkenalkan diri Anda secara singkat sebagai pewawancara, dan ajukan 1 pertanyaan pembuka yang sesuai untuk posisi ${profile.targetRole}.`,
        },
      ],
    });
  }

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.75,
          maxOutputTokens: 350,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err: unknown) {
      console.warn(`Gemini model ${model} failed, trying next candidate:`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}

export async function generateGeminiEvaluation(
  profile: CandidateProfile,
  messages: ChatMessage[],
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<ScorecardReport | null> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const systemPrompt = getEvaluationSystemPrompt(profile);
  const modelsToTry = [modelOverride, ...GEMINI_CANDIDATE_MODELS].filter(Boolean) as string[];

  const transcriptText = messages
    .map((m) => `[${m.sender === 'ai' ? 'Pewawancara' : profile.name}]: ${m.text}`)
    .join('\n\n');

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Berikut adalah transkrip lengkap percakapan wawancara:\n\n${transcriptText}\n\nBerikan laporan evaluasi scorecard lengkap beserta nilai untuk SETIAP jawaban yang diberikan kandidat sesuai format JSON yang ditentukan.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: `${systemPrompt}\nKembalikan HANYA format JSON valid tanpa tanda kutip markdown pembungkus.`,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: ScorecardReport = JSON.parse(cleaned);
        return parsed;
      }
    } catch (err: unknown) {
      console.warn(`Gemini evaluation with model ${model} failed, trying next:`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}

/**
 * Streaming balasan pewawancara dari Google Gemini (SSE Stream)
 */
export async function streamGeminiInterviewerReply(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<ReadableStream<Uint8Array> | null> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const encoder = new TextEncoder();
  const modelsToTry = [modelOverride, ...GEMINI_CANDIDATE_MODELS].filter(Boolean) as string[];

  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  for (const model of modelsToTry) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.75,
          maxOutputTokens: 350,
        },
      });

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              const chunkText = chunk.text;
              if (chunkText) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (streamErr) {
            controller.error(streamErr);
          }
        },
      });
    } catch (err: unknown) {
      console.warn(`Gemini streaming with model ${model} failed, trying next:`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}
