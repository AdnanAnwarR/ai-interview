import { NextRequest, NextResponse } from 'next/server';
import { CandidateProfile, ChatMessage } from '@/types/interview';
import { getSystemPromptForInterview } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, messages }: { profile: CandidateProfile; messages: ChatMessage[] } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const systemPrompt = getSystemPromptForInterview(profile);

    // If GEMINI_API_KEY is provided, call Google Generative AI
    if (geminiApiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Baik, saya siap memulai wawancara sesuai persona dan panduan tersebut.' }] },
          ...messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        ];

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply: reply.trim() });
          }
        }
      } catch (apiErr) {
        console.warn('Gemini API call failed, using intelligent contextual fallback:', apiErr);
      }
    }

    // Contextual intelligent fallback when no API key is set
    const userTurnCount = messages.filter((m) => m.sender === 'user').length;
    let fallbackReply = '';

    if (profile.selectedMode === 'hrd') {
      if (userTurnCount === 0) {
        fallbackReply = `Halo ${profile.name || 'Kandidat'}! Senang sekali bertemu dengan Anda hari ini untuk posisi ${profile.targetRole}. Boleh ceritakan sedikit tentang diri Anda dan apa yang membuat Anda tertarik dengan posisi ini?`;
      } else if (userTurnCount === 1) {
        fallbackReply = `Terima kasih atas perkenalannya yang jelas. Dalam pengalaman kerja atau organisasi Anda sebelumnya, bisa ceritakan salah satu situasi saat Anda menghadapi deadline yang sangat ketat atau konflik dalam tim? Bagaimana Anda menanganinya?`;
      } else if (userTurnCount === 2) {
        fallbackReply = `Menarik sekali cara Anda menyelesaikan situasi tersebut. Jika Anda diterima di perusahaan ini, bagaimana Anda menyesuaikan diri dengan budaya kerja baru serta apa ekspektasi atau tujuan karier Anda dalam 2 tahun ke depan?`;
      } else {
        fallbackReply = `Bagus sekali penjelasannya, saya sangat menghargai kejujuran dan refleksi Anda. Adakah pertanyaan yang ingin Anda tanyakan kepada saya mengenai tim atau budaya kerja di perusahaan kami?`;
      }
    } else {
      // Technical Mode
      if (userTurnCount === 0) {
        fallbackReply = `Halo ${profile.name || 'Kandidat'}, selamat datang di sesi Technical Interview untuk posisi ${profile.targetRole}. Untuk pemanasan, bisa ceritakan arsitektur atau proyek teknis paling menantang yang pernah Anda kembangkan sesuai CV Anda?`;
      } else if (userTurnCount === 1) {
        fallbackReply = `Menarik. Ketika sistem tersebut mulai menangani lonjakan traffic atau data yang besar, bagaimana strategi Anda dalam optimasi performa, caching, serta menangani concurrency atau race condition?`;
      } else if (userTurnCount === 2) {
        fallbackReply = `Pendekatan yang solid. Bagaimana Anda mengelola error handling, monitoring log, dan automated testing untuk memastikan deployment ke production tidak mengalami downtime?`;
      } else {
        fallbackReply = `Terima kasih atas penjelasan teknis yang komprehensif dan sistematis. Apakah ada aspek arsitektur atau teknologi terkini yang sedang Anda eksplorasi secara mendalam belakangan ini?`;
      }
    }

    return NextResponse.json({ reply: fallbackReply });
  } catch (error) {
    console.error('Interview chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat response' }, { status: 500 });
  }
}
