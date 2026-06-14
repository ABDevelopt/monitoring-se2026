// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  
  // Hanya admin yang diizinkan mengakses CRUD user
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        kecamatan: true,
        tugasPcl: {
          include: {
            subsls: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    
    // Jangan kirim password hash ke client!
    const sanitizedUsers = users.map(user => {
      const { passwordHash, ...rest } = user;
      return rest;
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('API admin get users error:', error);
    return NextResponse.json({ error: 'Gagal memuat data user' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nama, username, password, role, idKecamatan, subSlsIds } = body;

    if (!nama || !username || !password || !role) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Cek duplikasi username
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah terdaftar' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        nama,
        username: cleanUsername,
        passwordHash,
        role,
        idKecamatan: role === 'pml' && idKecamatan ? parseInt(idKecamatan) : null,
      },
    });

    // Jika PCL dan ada assignment sub-SLS
    if (role === 'pcl' && Array.isArray(subSlsIds) && subSlsIds.length > 0) {
      const assignments = subSlsIds.map((subId: number) => ({
        idUser: user.id,
        idSubsls: subId,
      }));
      
      // SQLite tidak mendukung createMany di beberapa versi prisma lama dengan lancar,
      // kita loop dengan Promise.all atau prisma.tugasPcl.create.
      await Promise.all(
        assignments.map((ass) =>
          prisma.tugasPcl.create({
            data: ass,
          })
        )
      );
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    return NextResponse.json({ success: true, user: sanitizedUser });

  } catch (error) {
    console.error('API admin post user error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan user' }, { status: 500 });
  }
}
