import { z } from 'zod';

export const experienceLevelSchema = z.enum(['fresh_graduate', 'mid_level', 'senior']);

export const interviewModeSchema = z.enum(['hrd', 'technical']);

export const candidateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
  targetCompany: z
    .string()
    .trim()
    .min(2, { message: 'Nama perusahaan minimal 2 karakter' })
    .max(100, { message: 'Nama perusahaan maksimal 100 karakter' }),
  targetRole: z
    .string()
    .trim()
    .min(2, { message: 'Posisi target minimal 2 karakter' })
    .max(100, { message: 'Posisi target maksimal 100 karakter' }),
  jobDescription: z
    .string()
    .trim()
    .min(10, { message: 'Deskripsi pekerjaan minimal 10 karakter' })
    .max(5000, { message: 'Deskripsi pekerjaan maksimal 5000 karakter' }),
  cvContent: z
    .string()
    .trim()
    .max(10000, { message: 'Ringkasan CV maksimal 10000 karakter' })
    .default(''),
  cvFileName: z.string().optional(),
  experienceLevel: experienceLevelSchema,
  selectedMode: interviewModeSchema,
});

export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(['ai', 'user']),
  text: z.string().trim().min(1, { message: 'Pesan tidak boleh kosong' }),
  timestamp: z.number().int().positive(),
  durationSec: z.number().optional(),
});

export const chatRequestSchema = z.object({
  profile: candidateProfileSchema,
  messages: z.array(chatMessageSchema),
  groqApiKey: z.string().optional(),
  groqModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
});

export const evaluateRequestSchema = z.object({
  profile: candidateProfileSchema,
  messages: z.array(chatMessageSchema).min(1, { message: 'Transkrip pesan tidak boleh kosong' }),
  groqApiKey: z.string().optional(),
  groqModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
});

export const midtransCreatePaymentSchema = z.object({
  tierId: z.enum(['single_session', 'pro_pack', 'pack_5_sessions', 'unlimited_monthly']),
  customerName: z.string().trim().min(2),
  customerEmail: z.string().trim().email(),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type EvaluateRequestInput = z.infer<typeof evaluateRequestSchema>;
export type MidtransCreatePaymentInput = z.infer<typeof midtransCreatePaymentSchema>;
