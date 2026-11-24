import { z } from 'zod';

export const experienceLevelSchema = z.enum(['fresh_graduate', 'mid_level', 'senior']);

export const interviewModeSchema = z.enum(['hrd', 'technical']);

export const candidateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama lengkap tidak boleh kosong' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' })
    .default('Kandidat'),
  targetCompany: z
    .string()
    .trim()
    .min(1, { message: 'Nama perusahaan tidak boleh kosong' })
    .max(100, { message: 'Nama perusahaan maksimal 100 karakter' })
    .default('Perusahaan Target'),
  targetRole: z
    .string()
    .trim()
    .min(1, { message: 'Posisi target tidak boleh kosong' })
    .max(100, { message: 'Posisi target maksimal 100 karakter' })
    .default('Posisi'),
  jobDescription: z
    .string()
    .optional()
    .default('')
    .transform((val) => (val && val.trim().length >= 5 ? val.trim() : 'Posisi dan tanggung jawab umum pengembangan pada perusahaan target.')),
  cvContent: z
    .string()
    .trim()
    .max(10000, { message: 'Ringkasan CV maksimal 10000 karakter' })
    .default(''),
  cvFileName: z.string().optional(),
  experienceLevel: experienceLevelSchema.default('fresh_graduate'),
  selectedMode: interviewModeSchema.default('hrd'),
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
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  groqApiKey: z.string().optional(),
  groqModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
});

export const evaluateRequestSchema = z.object({
  profile: candidateProfileSchema,
  messages: z.array(chatMessageSchema).min(1, { message: 'Transkrip pesan tidak boleh kosong' }),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
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
