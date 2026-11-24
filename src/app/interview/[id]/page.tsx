'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { InterviewConfig, InterviewMessage } from '@/types/wawancara';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SessionData {
  id: string;
  config?: InterviewConfig;
  company?: string;
  position?: string;
  level?: string;
  style?: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  messages: InterviewMessage[];
}

export default function InterviewDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/interviews/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Sesi wawancara tidak ditemukan atau telah kadaluarsa.');
        }
        return res.json();
      })
      .then((data: SessionData) => {
        setSession(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Gagal memuat sesi wawancara.';
        setError(msg);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1624] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#4A8DF0] animate-spin mb-4" />
        <h2 className="text-lg font-bold">Mempersiapkan Ruang Wawancara...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Menghubungkan ke server audio dan AI rekruter.
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0E1624] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#152033] rounded-3xl p-6 sm:p-8 border border-slate-700 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F67BB] text-white font-bold text-sm hover:bg-[#4A8DF0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Formulir
          </Link>
        </div>
      </div>
    );
  }

  const resolvedConfig: InterviewConfig = session.config || {
    companyName: session.company || 'Perusahaan',
    targetRole: session.position || 'Posisi',
    level: (session.level as any) || 'fresh_graduate',
    interviewerStyle: (session.style as any) || 'ramah',
    questionCount: (session.totalQuestions as any) || 5,
    answerMode: 'suara',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1624]">
      <InterviewRoom
        interviewId={session.id}
        config={resolvedConfig}
        initialMessages={session.messages}
        initialQuestionIndex={session.currentQuestionIndex}
        totalQuestions={session.totalQuestions}
      />
    </div>
  );
}
