// src/app/actions/auth.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export interface FormState {
  error?: string;
  success?: boolean;
}

export async function loginAction(state: FormState | undefined, formData: FormData): Promise<FormState> {
  const username = formData.get('username')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return { error: 'Username dan password wajib diisi.' };
  }

  try {
    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return { error: 'Username tidak terdaftar atau akun tidak aktif.' };
    }

    // Cocokkan password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return { error: 'Password salah.' };
    }

    // Buat session cookie
    await createSession({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role as 'admin' | 'korlap' | 'pml' | 'pcl',
      idKecamatan: user.idKecamatan,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan sistem. Silakan coba lagi.' };
  }

  // Redirect harus dipanggil di luar try-catch karena redirect melempar error internal Next.js
  redirect('/dashboard');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
