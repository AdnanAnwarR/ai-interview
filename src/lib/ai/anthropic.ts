import Anthropic from '@anthropic-ai/sdk';
import { CandidateProfile, ChatMessage, ScorecardReport } from '@/types/interview';
import { getSystemPromptForInterview, getEvaluationSystemPrompt } from './prompts';

/**
 * Anthropic Claude Integration for "Wawancarain"
 * Menggunakan Claude 3.5 Sonnet / Haiku untuk wawancara kerja interaktif dan evaluasi mendalam per-jawaban
 */

export async function generateClaudeInterviewReply(
  profile: CandidateProfile,
  messages: ChatMessage[],
  apiKeyOverride?: string
): Promise<string | null> {
  const apiKey = apiKeyOverride || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey: apiKey.trim() });
    const systemPrompt = getSystemPromptForInterview(profile);

    // Format messages for Claude
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    // Initial greeting if no messages yet
    if (claudeMessages.length === 0) {
      claudeMessages.push({
        role: 'user',
        content: `Mulai sesi wawancara sekarang. Sapa saya dengan ramah, perkenalkan diri Anda singkat sebagai pewawancara di ${profile.targetCompany || 'perusahaan'}, dan berikan 1 pertanyaan pembuka untuk posisi ${profile.targetRole}.`,
      });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 350,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === 'text') {
      return firstBlock.text.trim();
    }
  } catch (error) {
    console.warn('Anthropic Claude chat API call failed, falling back:', error);
  }

  return null;
}

export async function generateClaudeEvaluation(
  profile: CandidateProfile,
  messages: ChatMessage[],
  apiKeyOverride?: string
): Promise<ScorecardReport | null> {
  const apiKey = apiKeyOverride || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey: apiKey.trim() });
    const systemPrompt = getEvaluationSystemPrompt(profile);

    const transcriptText = messages
      .map((m) => `[${m.sender === 'ai' ? 'Pewawancara' : profile.name}]: ${m.text}`)
      .join('\n\n');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      system: `${systemPrompt}\nKembalikan HANYA format JSON valid tanpa tanda kutip markdown pembungkus.`,
      messages: [
        {
          role: 'user',
          content: `Berikut adalah transkrip lengkap percakapan wawancara:\n\n${transcriptText}\n\nBerikan laporan evaluasi scorecard lengkap beserta nilai untuk SETIAP jawaban yang diberikan kandidat.`,
        },
      ],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === 'text') {
      const cleaned = firstBlock.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: ScorecardReport = JSON.parse(cleaned);
      return parsed;
    }
  } catch (error) {
    console.warn('Anthropic Claude evaluation API call failed:', error);
  }

  return null;
}
