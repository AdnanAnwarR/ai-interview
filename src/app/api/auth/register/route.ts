import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Alamat email ini sudah terdaftar. Silakan masuk di halaman Login.' },
        { status: 409 }
      );
    }

    // Buat akun baru di database dengan 1 sesi gratis
    const newUser = await db.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        credits: 1, // 1 Sesi gratis awal
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat.',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err: unknown) {
    console.error('Registration API error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal memproses pendaftaran.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

